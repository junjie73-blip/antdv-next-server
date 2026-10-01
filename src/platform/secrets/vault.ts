import vault, { type VaultOptions } from "node-vault";
import { logger } from "@/platform/logger/index.js";
import { AppError } from "@/core/errors.js";

interface VaultConfig {
  endpoint: string;
  token: string;
  namespace?: string;
}

interface CachedSecret {
  data: Record<string, string>;
  expireAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

export class VaultClient {
  private client: vault.client | null = null;
  private cache = new Map<string, CachedSecret>();
  private initialized = false;

  /**
   * 初始化（幂等）
   */
  async init(config: VaultConfig): Promise<void> {
    if (this.initialized) return;

    try {
      this.client = vault({
        apiVersion: "v1",
        endpoint: config.endpoint,
        token: config.token,
        namespace: config.namespace,
      } as VaultOptions);

      // 健康检查
      const health = await this.client.health();
      if (health.sealed) {
        throw new Error("Vault is sealed");
      }

      this.initialized = true;
      logger.info({ endpoint: config.endpoint }, "[vault] connected");
    } catch (err) {
      logger.error({ err }, "[vault] 连接失败");
      throw err;
    }
  }

  /**
   * 读取密钥（带缓存）
   */
  async getSecret(path: string, key: string): Promise<string | undefined> {
    if (!this.client) {
      throw new AppError("Vault 未初始化", 500001, 500);
    }

    // 查缓存
    const cached = this.cache.get(path);
    if (cached && cached.expireAt > Date.now()) {
      return cached.data[key];
    }

    // 从 Vault 读
    try {
      const result = await this.client.read(`secret/data/${path}`);
      const data = (result?.data?.data ?? {}) as Record<string, string>;

      this.cache.set(path, {
        data,
        expireAt: Date.now() + CACHE_TTL,
      });

      return data[key];
    } catch (err) {
      logger.error({ err, path, key }, "[vault] 读取失败");
      throw err;
    }
  }

  /**
   * 批量读取
   */
  async getSecrets(path: string): Promise<Record<string, string>> {
    if (!this.client) {
      throw new AppError("Vault 未初始化", 500001, 500);
    }

    const cached = this.cache.get(path);
    if (cached && cached.expireAt > Date.now()) {
      return cached.data;
    }

    const result = await this.client.read(`secret/data/${path}`);
    const data = (result?.data?.data ?? {}) as Record<string, string>;

    this.cache.set(path, { data, expireAt: Date.now() + CACHE_TTL });
    return data;
  }

  /**
   * 清缓存
   */
  invalidateCache(path?: string): void {
    if (path) {
      this.cache.delete(path);
    } else {
      this.cache.clear();
    }
  }
}

export const vaultClient = new VaultClient();
