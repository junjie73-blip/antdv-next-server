import { LoginRule } from "./base.js";
import { ABNORMAL_TYPE, DETECT_CONFIG } from "../constants.js";
import { distanceKm, lookup } from "../geoip.js";
import type { RuleContext, RuleResult } from "../types.js";

/**
 * 规则：不可能旅行
 * 条件：
 *   1. 有历史记录
 *   2. 上一次登录与本次的地理位置相距 > 阈值
 *   3. 时间间隔 < 阈值
 *   4. 计算出的"移动速度" > TRAVEL_MAX_SPEED_KMH
 */
export class ImpossibleTravelRule extends LoginRule {
  readonly name = "impossible-travel";
  readonly type = ABNORMAL_TYPE.IMPOSSIBLE_TRAVEL;

  async evaluate(ctx: RuleContext): Promise<RuleResult> {
    const { current, currentGeo, history } = ctx;

    if (history.length === 0) return { hit: false, type: this.type };

    // 当前登录必须有坐标
    if (
      !currentGeo.resolved ||
      currentGeo.latitude === undefined ||
      currentGeo.longitude === undefined
    ) {
      return { hit: false, type: this.type };
    }

    // 找最近一次有坐标的历史记录
    const last = history.find((h) => {
      if (!h.country) return false;
      // 尝试从缓存取坐标
      return true;
    });
    if (!last) return { hit: false, type: this.type };

    // 获取上一条记录的坐标（可能需查 GeoIP）
    let lastLat = last.latitude;
    let lastLng = last.longitude;
    if (lastLat === undefined || lastLng === undefined) {
      const lastGeo = await lookup(last.ip);
      if (!lastGeo.resolved) return { hit: false, type: this.type };
      lastLat = lastGeo.latitude;
      lastLng = lastGeo.longitude;
    }

    if (lastLat === undefined || lastLng === undefined) {
      return { hit: false, type: this.type };
    }

    // 时间间隔（分钟）
    const gapMinutes =
      (current.loginAt.getTime() - last.createdAt.getTime()) / 60000;
    if (gapMinutes < DETECT_CONFIG.TRAVEL_MIN_GAP_MINUTES) {
      // 短时间内的连续登录不判断（可能是网络抖动）
      return { hit: false, type: this.type };
    }

    // 地理距离
    const distance = distanceKm(
      lastLat as number,
      lastLng as number,
      currentGeo.latitude,
      currentGeo.longitude,
    );

    // 移动速度
    const speed = distance / (gapMinutes / 60);
    if (speed <= DETECT_CONFIG.TRAVEL_MAX_SPEED_KMH) {
      return { hit: false, type: this.type };
    }

    return {
      hit: true,
      type: this.type,
      reason:
        `检测到不可能旅行：${last.city ?? last.province ?? "未知"} ` +
        `→ ${currentGeo.city ?? currentGeo.province ?? "未知"} ` +
        `(${distance.toFixed(0)}km / ${gapMinutes.toFixed(0)}分钟，约 ${speed.toFixed(0)}km/h)`,
      metadata: {
        from: { city: last.city, ip: last.ip, at: last.createdAt },
        to: { city: currentGeo.city, ip: current.ip, at: current.loginAt },
        distanceKm: Math.round(distance),
        gapMinutes: Math.round(gapMinutes),
        speedKmh: Math.round(speed),
      },
    };
  }
}
