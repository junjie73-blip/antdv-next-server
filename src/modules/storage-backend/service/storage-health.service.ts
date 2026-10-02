import { logger } from "@/platform/logger/index.js";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { StorageBackendRepository } from "../repository.js";
import { decryptSensitive } from "../sensitive.js";
import { SENSITIVE_CONFIG_KEYS, FAILOVER_THRESHOLD } from "../constants.js";
import { invalidateActiveBackend } from "../cache.js";
import { invalidateStorage } from "@/platform/storage/factory.js";

export class StorageHealthService {
  private repo = new StorageBackendRepository();
  private failCount = new Map<string, number>();

  /** 对所有后端执行健康检查（定时任务调用） */
  async checkAll(tenantId: string): Promise<void> {
    const backends = await this.repo.listHealthyByPriority(tenantId);
    for (const b of backends) {
      await this.checkOne(b, tenantId);
    }
  }

  async checkOne(
    backend: { backend_id: string; backend_type: string; config: unknown },
    tenantId: string,
  ): Promise<void> {
    const t0 = Date.now();
    try {
      const config = decryptSensitive(
        backend.config as Record<string, unknown>,
        SENSITIVE_CONFIG_KEYS,
      );
      await this.ping(backend.backend_type, config);
      const latency = Date.now() - t0;

      await this.repo.updateHealth(backend.backend_id, true, null);
      this.failCount.delete(backend.backend_id);

      logger.debug(
        { backendId: backend.backend_id, latency },
        "[storage-health] ok",
      );
    } catch (err: any) {
      const n = (this.failCount.get(backend.backend_id) ?? 0) + 1;
      this.failCount.set(backend.backend_id, n);

      await this.repo.updateHealth(
        backend.backend_id,
        false,
        String(err?.message ?? err).slice(0, 500),
      );

      logger.warn(
        { err: err.message, backendId: backend.backend_id, failCount: n },
        "[storage-health] failed",
      );

      // 达到阈值 → 触发 failover
      if (n >= FAILOVER_THRESHOLD) {
        await this.tryFailover(backend.backend_id, tenantId);
      }
    }
  }

  /** 主后端挂了，切到下一个健康的 */
  private async tryFailover(failedId: string, tenantId: string): Promise<void> {
    const active = await this.repo.findActive(tenantId);
    if (!active || active.backend_id !== failedId) return; // 挂的不是激活的，忽略

    const healthy = await this.repo.listHealthyByPriority(tenantId);
    const next = healthy.find((b) => b.backend_id !== failedId);
    if (!next) {
      logger.error({ tenantId }, "[storage-health] no failover target");
      return;
    }

    await this.repo.activate(next.backend_id, tenantId, "system");
    await invalidateActiveBackend(tenantId);
    invalidateStorage(tenantId);

    logger.warn(
      { tenantId, from: failedId, to: next.backend_id },
      "[storage-health] failover executed",
    );
  }

  /* ============================================================
   * 各类型探测
   * ============================================================ */
  private async ping(
    type: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    if (type === "local") return; // 本地存储无需探测

    if (type === "minio" || type === "s3" || type === "oss" || type === "cos") {
      const endpoint = String(
        config.endpoint ?? config.minioEndpoint ?? config.ossEndpoint ?? "",
      );
      if (!endpoint) throw new Error("endpoint 未配置");

      const client = new S3Client({
        region: String(config.region ?? "us-east-1"),
        endpoint,
        forcePathStyle: true,
        credentials: {
          accessKeyId: String(config.accessKey ?? config.accessKeyId ?? ""),
          secretAccessKey: String(
            config.accessKeySecret ?? config.secretKey ?? "",
          ),
        },
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 3000,
          requestTimeout: 10_000,
        }),
        maxAttempts: 1,
      });

      await client.send(new ListBucketsCommand({}));
    }
  }
}

export const storageHealthService = new StorageHealthService();
