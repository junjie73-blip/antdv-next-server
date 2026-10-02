import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { BackupRepository } from "./repository.js";
import { BackupExecutor } from "./executor.js";
import { env } from "@/config/env.js";
import { getSystemStorage } from "@/platform/storage/system.js";

export class BackupService {
  private repo = new BackupRepository();
  private executor = new BackupExecutor(this.repo);

  async list(params: {
    status?: string;
    triggerType?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.findPage(params);
  }

  async detail(backupId: string) {
    const r = await this.repo.findById(backupId);
    if (!r) throw new AppError("备份不存在", 404001, 404);
    return r;
  }

  /** 异步触发备份（立刻返回 backupId，后台执行） */
  async trigger(opts: {
    triggerType: "manual" | "cron" | "pre_migrate";
    backupType?: "full" | "schema_only" | "data_only";
    remark?: string;
    userId?: string;
    retainDays?: number;
  }): Promise<{ backupId: string }> {
    const dbName = new URL(env.DATABASE_URL).pathname.slice(1);

    const record = await this.repo.create({
      triggerType: opts.triggerType,
      backupType: opts.backupType ?? "full",
      databaseName: dbName,
      createdBy: opts.userId,
      remark: opts.remark,
    });

    // 后台执行，不阻塞 HTTP 响应
    setImmediate(() => {
      void this.executor.execute(record.backup_id, {
        retainDays: opts.retainDays,
      });
    });

    return { backupId: record.backup_id };
  }

  /** 同步执行（供 cron 用） */
  async triggerSync(opts: Parameters<BackupService["trigger"]>[0]) {
    const dbName = new URL(env.DATABASE_URL).pathname.slice(1);
    const record = await this.repo.create({
      triggerType: opts.triggerType,
      backupType: opts.backupType ?? "full",
      databaseName: dbName,
      remark: opts.remark,
    });
    await this.executor.execute(record.backup_id, {
      retainDays: opts.retainDays,
    });
    return record.backup_id;
  }

  /** 获取下载链接（预签名，5 分钟有效） */
  async getDownloadUrl(backupId: string) {
    const r = await this.detail(backupId);
    if (r.status !== "completed" || !r.storage_key) {
      throw new AppError("备份未完成或文件不存在", 400001, 400);
    }
    const storage = await getSystemStorage();
    const url = await storage.presignedUrl({
      key: r.storage_key,
      expiresSec: 300, // 5 分钟
      responseContentType: "application/gzip",
      responseContentDisposition: `attachment; filename="${r.file_name ?? "backup.sql.gz"}"`,
    });
    return { url, fileName: r.file_name, expiresIn: 300 };
  }

  /** 删除备份（对象 + 记录） */
  async remove(backupId: string) {
    const r = await this.detail(backupId);
    const storage = await getSystemStorage();
    if (r.storage_key) {
      await storage.deleteObject(r.storage_key).catch((err) => {
        logger.warn({ err, backupId }, "[backup] s3 delete failed (continue)");
      });
    }
    await this.repo.remove(backupId);
    logger.info({ backupId }, "[backup] removed");
  }

  /** 清理过期备份（定时任务） */
  async cleanupExpired(): Promise<number> {
    const expired = await this.repo.findExpired(100);
    if (expired.length === 0) return 0;

    let count = 0;
    for (const b of expired) {
      try {
        const storage = await getSystemStorage();
        if (b.storage_key) {
          await storage
            .deleteObject(b.storage_key)
            .catch((err) =>
              logger.warn(
                { err, backupId: b.backup_id },
                "[backup] s3 delete fail",
              ),
            );
        }
        await this.repo.remove(b.backup_id);
        count++;
      } catch (err) {
        logger.error({ err, backupId: b.backup_id }, "[backup] cleanup failed");
      }
    }
    logger.info({ count, total: expired.length }, "[backup] cleanup done");
    return count;
  }

  /** 策略 CRUD */
  async listPolicies() {
    return this.repo.listPolicies();
  }
  async upsertPolicy(data: Parameters<BackupRepository["upsertPolicy"]>[0]) {
    return this.repo.upsertPolicy(data);
  }
  async deletePolicy(policyId: string, userId: string) {
    return this.repo.deletePolicy(policyId, userId);
  }
}
