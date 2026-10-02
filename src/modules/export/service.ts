import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { redis } from "@/config/redis.js";
import {
  deleteFileByUrl,
  getStorageForTenant,
} from "@/platform/storage/factory.js";
import { ExportRepository } from "./repository.js";
import { ExportExecutor } from "./executor.js";
import { exportQueue } from "@/platform/queue/queues.js";
import { getExportHandler } from "./handlers/index.js";

const MAX_ACTIVE = 5;
const RATE_LIMIT_KEY = (uid: string) => `export:rate:${uid}`;
const RATE_LIMIT_WINDOW = 60; // 秒
const RATE_LIMIT_MAX = 10; // 每分钟最多提交 10 次
const DOWNLOAD_URL_TTL = 300;
export class ExportService {
  private repo = new ExportRepository();
  private executor = new ExportExecutor(this.repo);

  /**
   * 提交导出任务：立刻返回 taskId，后台由 worker 执行
   */
  async submit(opts: {
    tenantId: string;
    userId: string;
    bizType: string;
    exportFormat?: "xlsx" | "csv" | "json";
    queryParams?: Record<string, unknown>;
    columns?: string[];
  }): Promise<{ taskId: string }> {
    // 校验 bizType
    try {
      getExportHandler(opts.bizType);
    } catch {
      throw new AppError(`不支持的导出类型: ${opts.bizType}`, 400001, 400);
    }

    // 限流：同一用户每分钟最多 RATE_LIMIT_MAX 次
    const rl = await redis.incr(RATE_LIMIT_KEY(opts.userId));
    if (rl === 1)
      await redis.expire(RATE_LIMIT_KEY(opts.userId), RATE_LIMIT_WINDOW);
    if (rl > RATE_LIMIT_MAX) {
      throw new AppError("导出请求过于频繁，请稍后再试", 429001, 429);
    }

    // 并发任务上限
    const active = await this.repo.countActive(opts.userId);
    if (active >= MAX_ACTIVE) {
      throw new AppError(
        `同时进行的导出任务不能超过 ${MAX_ACTIVE} 个`,
        429001,
        429,
      );
    }

    // 创建任务
    const task = await this.repo.create({
      tenantId: opts.tenantId,
      userId: opts.userId,
      bizType: opts.bizType,
      exportFormat: opts.exportFormat ?? "xlsx",
      queryParams: opts.queryParams,
      columns: opts.columns,
    });

    // 入队
    const job = await exportQueue.add(
      "export",
      { taskId: task.task_id },
      {
        jobId: `export-${task.task_id}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 }, // 30s, 60s, 120s
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    await this.repo.update(task.task_id, { job_id: job.id });

    logger.info(
      { taskId: task.task_id, bizType: opts.bizType, userId: opts.userId },
      "[export] task submitted",
    );
    return { taskId: task.task_id };
  }

  async detail(taskId: string, tenantId: string, userId?: string) {
    const task = await this.repo.findById(taskId);
    if (!task || task.tenant_id !== tenantId) {
      throw new AppError("导出任务不存在", 404001, 404);
    }
    if (userId && task.user_id !== userId) {
      throw new AppError("无权访问此导出任务", 403001, 403);
    }
    return task;
  }

  async list(params: {
    tenantId: string;
    userId?: string;
    status?: string;
    bizType?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.list(params);
  }

  /** 取消任务 */
  async cancel(taskId: string, tenantId: string, userId: string) {
    const task = await this.detail(taskId, tenantId, userId);
    if (!["pending", "processing"].includes(task.status)) {
      throw new AppError("只能取消未完成的任务", 400001, 400);
    }
    if (task.job_id) {
      const job = await exportQueue.getJob(task.job_id);
      await job?.remove().catch(() => undefined);
    }
    await this.repo.update(taskId, {
      status: "cancelled",
      completed_at: new Date(),
    });
  }

  /** 删除任务（含文件） */
  async remove(taskId: string, tenantId: string, userId: string) {
    const task = await this.detail(taskId, tenantId, userId);
    if (task.file_url) {
      await deleteFileByUrl(tenantId, task.file_url).catch((err) =>
        logger.warn({ err, taskId }, "[export] delete file failed"),
      );
    }
    await this.repo.update(taskId, { is_deleted: 1 });
  }

  /** 获取下载链接（复用 file_url；前端直接跳转） */
  async getDownload(
    taskId: string,
    tenantId: string,
    userId: string,
    ip: string,
  ) {
    const task = await this.detail(taskId, tenantId, userId);
    if (task.status !== "completed" || !task.file_url) {
      throw new AppError("文件尚未准备好", 400001, 400);
    }
    if (task.expires_at && task.expires_at.getTime() < Date.now()) {
      throw new AppError("文件已过期，请重新导出", 410001, 410);
    }
    const storage = await getStorageForTenant(tenantId);
    const key = storage.keyFromUrl(task.file_url ?? "");
    if (!key) {
      logger.error(
        { taskId, fileUrl: task.file_url },
        "[export] cannot resolve storage key from file_url",
      );
      throw new AppError("文件地址无效，请联系管理员", 500001, 500);
    }

    // 2. 生成预签名 URL
    const url = await storage.presignedUrl({
      key,
      expiresSec: DOWNLOAD_URL_TTL,
      responseContentType: getContentType(task.export_format),
      responseContentDisposition: buildContentDisposition(task.file_name),
    });

    // 3. 记录下载审计
    await this.repo.incrementDownload(taskId, ip);

    logger.info(
      { taskId, userId, key, expiresIn: DOWNLOAD_URL_TTL },
      "[export] presigned url generated",
    );

    return {
      url,
      fileName: task.file_name ?? "export",
      expiresIn: DOWNLOAD_URL_TTL,
    };
  }

  /** 定时清理过期文件 */
  async cleanupExpired(): Promise<number> {
    const expired = await this.repo.findExpired(100);
    if (expired.length === 0) return 0;
    let count = 0;
    for (const t of expired) {
      try {
        if (t.file_url) {
          await deleteFileByUrl(t.tenant_id, t.file_url).catch(() => undefined);
        }
        await this.repo.update(t.task_id, {
          status: "expired",
          file_url: null,
        });
        count++;
      } catch (err) {
        logger.warn({ err, taskId: t.task_id }, "[export] cleanup failed");
      }
    }
    logger.info({ count }, "[export] cleanup done");
    return count;
  }

  /** 复位卡住的任务（进程崩溃时可能出现） */
  async resetStuck(): Promise<number> {
    const stuck = await this.repo.findStuck();
    if (stuck.length === 0) return 0;
    for (const t of stuck) {
      await this.repo.update(t.task_id, {
        status: "failed",
        error_msg: "任务超时未完成（进程可能已重启）",
      });
    }
    logger.warn({ count: stuck.length }, "[export] reset stuck tasks");
    return stuck.length;
  }

  /** 直接执行（同步，供手动触发 / 测试） */
  async executeSync(taskId: string) {
    await this.executor.execute(taskId);
  }
}
function buildContentDisposition(fileName: string | null): string {
  const name = fileName ?? "export";
  // 中文文件名需要 RFC 5987 编码
  return `attachment; filename="${encodeURIComponent(name)}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function getContentType(export_format: string): string {
  if (export_format === "excel") {
    return "application/vnd.ms-excel";
  }
  if (export_format === "csv") {
    return "text/csv";
  }
  return "application/json";
}
