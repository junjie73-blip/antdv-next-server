import consulClient from "consul";
import type { Resolver, ServiceEndpoint } from "./types.js";
import { logger } from "../logger.js";
import Consul from "consul";

export interface ConsulResolverOptions {
  host: string;
  port: number;
  /** 只返回 passing 的实例（默认 true） */
  passingOnly?: boolean;
  /** 缓存 TTL（毫秒），防止每次调用都请求 Consul */
  cacheTtlMs?: number;
  /** 服务名 → Consul 服务名映射（默认同名） */
  serviceNameMap?: Record<string, string>;
}

interface CacheEntry {
  endpoints: ServiceEndpoint[];
  expiresAt: number;
}

/**
 * Consul Resolver
 * - 从 Consul 健康检查中查询 passing 实例
 * - 缓存默认 5 秒
 * - Consul 不可用时抛错（由 grpc-client 决定 fallback）
 */
export class ConsulResolver implements Resolver {
  private consul: typeof Consul;
  private cache = new Map<string, CacheEntry>();
  private readonly passingOnly: boolean;
  private readonly cacheTtlMs: number;
  private readonly serviceNameMap: Record<string, string>;

  constructor(private readonly opts: ConsulResolverOptions) {
    this.consul = new Consul({
      host: opts.host,
      port: opts.port,
    });
    this.passingOnly = opts.passingOnly ?? true;
    this.cacheTtlMs = opts.cacheTtlMs ?? 5_000;
    this.serviceNameMap = opts.serviceNameMap ?? {};
  }

  async resolve(serviceName: string): Promise<ServiceEndpoint[]> {
    // 缓存命中
    const cached = this.cache.get(serviceName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.endpoints;
    }

    const consulName = this.serviceNameMap[serviceName] ?? serviceName;

    try {
      const result = await this.consul.health.service({
        service: consulName,
        passing: this.passingOnly,
      });

      const endpoints: ServiceEndpoint[] = result
        .filter((entry) => entry.Service?.Address && entry.Service?.Port)
        .map((entry) => ({
          host: entry.Service.Address,
          port: entry.Service.Port,
          weight: 1,
        }));

      if (endpoints.length === 0) {
        throw new Error(`[consul-resolver] 服务 "${consulName}" 无可用实例`);
      }

      this.cache.set(serviceName, {
        endpoints,
        expiresAt: Date.now() + this.cacheTtlMs,
      });

      logger.debug(
        { service: consulName, count: endpoints.length },
        "[consul-resolver] resolved",
      );

      return endpoints;
    } catch (err) {
      // Consul 故障时清理缓存，下次强制刷新
      this.cache.delete(serviceName);
      throw err;
    }
  }

  /** 清空缓存（测试或手动刷新用） */
  clearCache(): void {
    this.cache.clear();
  }

  async close(): Promise<void> {
    this.cache.clear();
  }
}
