import { Worker, type Job } from "bullmq";
import { createBullConnection } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import { UploadService } from "@/modules/infrastructure/upload/service.js";
import { FileRepository } from "@/modules/infrastructure/file/repository.js";
import {
  MergeJobData,
  MERGE_QUEUE_NAME,
} from "@/modules/infrastructure/upload/queue.js";
import cacheWarmWorker from "@/workers/cache-warm.worker.js";
import reportExportWorker from "@/workers/report-export.worker.js";
import wfNotifyWorker from "@/workers/wf-notify.worker.js";

const uploadService = new UploadService(new FileRepository());

/** 所有 worker 的集合 */
export interface WorkerBundle {
  /** 合并 worker（上传分片） */
  merge: Worker<MergeJobData>;
  /** 报表导出 worker */
  reportExport: Worker;
  /** 工作流通知 worker */
  wfNotify: Worker;
  /** 缓存预热 worker */
  cacheWarm: Worker;
  /** 全部 worker（用于统一关闭） */
  all: Worker[];
}

/**
 * 启动所有 Worker
 * - 每个 Worker 独立连接（避免阻塞命令相互影响）
 * - 统一注册事件监听
 */
export function startAllWorkers(): WorkerBundle {
  const merge = createMergeWorker();

  const all: Worker[] = [
    merge,
    reportExportWorker,
    wfNotifyWorker,
    cacheWarmWorker,
  ];

  // 统一注册事件（只注册一次）
  for (const w of all) {
    attachCommonListeners(w);
  }

  logger.info(
    {
      workers: all.map((w) => w.name),
      count: all.length,
    },
    "[worker] all started",
  );

  return {
    merge,
    reportExport: reportExportWorker,
    wfNotify: wfNotifyWorker,
    cacheWarm: cacheWarmWorker,
    all,
  };
}

/**
 * 仅启动 merge worker（保持向后兼容）
 * @deprecated 建议用 startAllWorkers
 */
export function startMergeWorker(): Worker<MergeJobData> {
  return createMergeWorker();
}

/**
 * 创建 merge worker
 */
function createMergeWorker(): Worker<MergeJobData> {
  return new Worker<MergeJobData>(
    MERGE_QUEUE_NAME,
    async (job: Job<MergeJobData>) => {
      const { taskId, ...params } = job.data;
      logger.info(
        { taskId, jobId: job.id, attempt: job.attemptsMade },
        "[worker:merge] start",
      );
      await uploadService.runMergeTask(taskId, params, job);
    },
    {
      connection: createBullConnection(MERGE_QUEUE_NAME),
      concurrency: 3,
      limiter: { max: 10, duration: 1000 },
    },
  );
}

/**
 * 注册通用事件监听
 */
function attachCommonListeners(worker: Worker): void {
  worker.on("completed", (job) => {
    logger.debug({ jobId: job?.id, queue: worker.name }, "[worker] completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        queue: worker.name,
        attempt: job?.attemptsMade,
        maxAttempts: job?.opts?.attempts,
        err: err?.message,
      },
      "[worker] failed",
    );
  });

  worker.on("error", (err) => {
    logger.error({ queue: worker.name, err }, "[worker] error");
  });

  worker.on("stalled", (jobId) => {
    logger.warn({ jobId, queue: worker.name }, "[worker] job stalled");
  });
}

/**
 * Worker 进程优雅退出
 * - 等待当前任务完成（close 默认会等）
 * - 支持传入单个或数组
 * - 30 秒超时强制退出
 * - 断开 DB / Redis
 */
export function installWorkerShutdown(workers: Worker | Worker[]): void {
  const list = Array.isArray(workers) ? workers : [workers];
  let shuttingDown = false;

  const handle = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(
      { signal, queues: list.map((w) => w.name), count: list.length },
      "[worker] shutting down...",
    );

    // 30 秒强制退出保护
    const forceExit = setTimeout(() => {
      logger.error("[worker] shutdown timeout (30s), force exit");
      process.exit(1);
    }, 30_000);
    forceExit.unref();

    try {
      // 并行关闭所有 worker（每个 worker.close 会等当前任务完成）
      const results = await Promise.allSettled(list.map((w) => w.close()));

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        logger.warn(
          {
            failed: failed.map((r) => (r as any).reason?.message),
          },
          "[worker] some workers failed to close",
        );
      }

      // 断开 DB
      await prisma.$disconnect();

      clearTimeout(forceExit);
      logger.info("[worker] shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "[worker] shutdown error");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => void handle("SIGTERM"));
  process.on("SIGINT", () => void handle("SIGINT"));

  // 未捕获异常兜底
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "[worker] uncaughtException");
    void handle("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "[worker] unhandledRejection");
  });
}
