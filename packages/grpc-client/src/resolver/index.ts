import type { Resolver } from "./types.js";
import { StaticResolver } from "./static-resolver.js";
import { ConsulResolver } from "./consul-resolver.js";

export * from "./types.js";
export { StaticResolver } from "./static-resolver.js";
export { ConsulResolver } from "./consul-resolver.js";

export interface CreateResolverOptions {
  /** 静态地址（registry=static 时用） */
  staticEndpoints?: Record<string, string | string[]>;
  /** Consul 配置（registry=consul 时用） */
  consul?: {
    host: string;
    port: number;
    passingOnly?: boolean;
    cacheTtlMs?: number;
    serviceNameMap?: Record<string, string>;
  };
}

/**
 * 根据环境变量创建 Resolver
 * - SERVICE_REGISTRY=consul → ConsulResolver（Consul 失败降级 StaticResolver）
 * - SERVICE_REGISTRY=static（默认）→ StaticResolver
 */
export function createResolver(opts: CreateResolverOptions): Resolver {
  const mode = (process.env.SERVICE_REGISTRY ?? "static").toLowerCase();

  if (mode === "consul" && opts.consul) {
    const consul = new ConsulResolver({
      host: opts.consul.host,
      port: opts.consul.port,
      passingOnly: opts.consul.passingOnly,
      cacheTtlMs: opts.consul.cacheTtlMs,
      serviceNameMap: opts.consul.serviceNameMap,
    });

    // 有静态兜底时包一层
    if (opts.staticEndpoints) {
      const fallback = new StaticResolver({
        endpoints: opts.staticEndpoints,
      });
      return wrapWithFallback(consul, fallback);
    }

    return consul;
  }

  if (!opts.staticEndpoints) {
    throw new Error(
      "[resolver] SERVICE_REGISTRY=static 必须提供 staticEndpoints",
    );
  }

  return new StaticResolver({ endpoints: opts.staticEndpoints });
}

/** Consul 失败时降级到静态 */
function wrapWithFallback(primary: Resolver, fallback: Resolver): Resolver {
  return {
    async resolve(serviceName: string) {
      try {
        return await primary.resolve(serviceName);
      } catch {
        return fallback.resolve(serviceName);
      }
    },
    close: async () => {
      await primary.close?.();
      await fallback.close?.();
    },
  };
}
