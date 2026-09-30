import type { Resolver, ServiceEndpoint } from "./types.js";

interface StaticConfig {
  /** 服务名 → "host:port" 或 ["host:port", ...] */
  endpoints: Record<string, string | string[]>;
}

/**
 * 静态地址解析器
 * 从环境变量或配置读取固定地址，适用于开发 / 小规模部署
 */
export class StaticResolver implements Resolver {
  private cache: Record<string, ServiceEndpoint[]>;

  constructor(config: StaticConfig) {
    this.cache = {};
    for (const [name, value] of Object.entries(config.endpoints)) {
      const arr = Array.isArray(value) ? value : [value];
      this.cache[name] = arr.map((addr) => this.parseAddr(addr));
    }
  }

  async resolve(serviceName: string): Promise<ServiceEndpoint[]> {
    const list = this.cache[serviceName];
    if (!list || list.length === 0) {
      throw new Error(
        `[grpc-client] no static endpoint configured for service "${serviceName}"`,
      );
    }
    return list;
  }

  private parseAddr(addr: string): ServiceEndpoint {
    const lastColon = addr.lastIndexOf(":");
    if (lastColon < 0) {
      throw new Error(`[grpc-client] invalid address: ${addr}`);
    }
    const host = addr.slice(0, lastColon);
    const port = Number(addr.slice(lastColon + 1));
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new Error(`[grpc-client] invalid port in address: ${addr}`);
    }
    return { host, port };
  }
}
