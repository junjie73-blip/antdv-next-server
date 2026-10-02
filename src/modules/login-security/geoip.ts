import geoip from "geoip-lite";
import { redis } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { GEOIP_CACHE_TTL } from "./constants.js";
import type { GeoInfo } from "./types.js";

const CACHE_PREFIX = "geoip:";

/** 内网/回环 IP 判断 */
function isPrivateIp(ip: string): boolean {
  if (!ip || ip === "unknown") return true;
  if (ip === "127.0.0.1" || ip === "::1") return true;
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
  const parts = ip.split(".").map(Number);
  if (parts.length === 4) {
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  return false;
}

/**
 * 查询 IP 归属地
 * - 走 Redis 缓存（24h）
 * - 内网 IP 直接返回未知
 */
export async function lookup(ip: string): Promise<GeoInfo> {
  if (isPrivateIp(ip)) {
    return { resolved: false };
  }

  const key = `${CACHE_PREFIX}${ip}`;

  // 1. 缓存
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as GeoInfo;
    }
  } catch (err) {
    logger.warn({ err, ip }, "[geoip] cache read failed");
  }

  // 2. 本地库查询
  const result: GeoInfo = { resolved: false };
  try {
    const geo = geoip.lookup(ip);
    if (geo) {
      result.resolved = true;
      result.country = geo.country;
      result.province = geo.region;
      result.city = geo.city;
      result.latitude = geo.ll?.[0];
      result.longitude = geo.ll?.[1];
      // geoip-lite 不直接提供 ISP
    }
  } catch (err) {
    logger.warn({ err, ip }, "[geoip] lookup failed");
  }

  // 3. 写缓存（包括未解析结果，防止反复查库）
  try {
    await redis.setex(key, GEOIP_CACHE_TTL, JSON.stringify(result));
  } catch (err) {
    logger.warn({ err, ip }, "[geoip] cache write failed");
  }

  return result;
}

/**
 * Haversine 距离（km）
 */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
