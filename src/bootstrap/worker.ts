import { Worker, type Job } from "bullmq";
import { createBullConnection } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import { UploadService } from "@/modules/infrastructure/upload/service.js";
import { FileRepository } from "@/modules/infrastructure/file/repository.js";
import {
  MergeJobData,
  MERGE_QUEUE_NAME,
  MERGE_LOCK_DURATION,
  MERGE_LOCK_RENEW,
  MERGE_MAX_STALLED,
  MERGE_STALLED_INTERVAL,
} from "@/platform/queue/queues.js";
import cacheWarmWorker from "@/workers/cache-warm.worker.js";
import reportExportWorker from "@/workers/report-export.worker.js";
import wfNotifyWorker from "@/workers/wf-notify.worker.js";
import exportWorker from "@/workers/export.worker.js";

const uploadService = new UploadService(new FileRepository());

export interface WorkerBundle {
  merge: Worker<MergeJobData>;
  reportExport: Worker;
  wfNotify: Worker;
  cacheWarm: Worker;
  exportWorker: Worker;
  all: Worker[];
}

export function startAllWorkers(): WorkerBundle {
  const merge = createMergeWorker();

  const all: Worker[] = [merge, reportExportWorker, wfNotifyWorker, cacheWarmWorker, exportWorker];

  for (const w of all) {
    attachCommonListeners(w);
  }

  logger.info({ workers: all.map((w) => w.name), count: all.length }, "[worker] all started");

  return {
    merge,
    reportExport: reportExportWorker,
    wfNotify: wfNotifyWorker,
    cacheWarm: cacheWarmWorker,
    exportWorker,
    all,
  };
}

/**
 * @deprecated 用 startAllWorkers
 */
export function startMergeWorker(): Worker<MergeJobData> {
  return createMergeWorker();
}

/* ============================================================
 * ⭐ merge worker（重点修复）
 * ============================================================ */
function createMergeWorker(): Worker<MergeJobData> {
  return new Worker<MergeJobData>(
    MERGE_QUEUE_NAME,
    async (job: Job<MergeJobData>) => {
      const { taskId, ...params } = job.data;

      await job.updateProgress(0);

      logger.info(
        {
          taskId,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          uploadId: params.uploadId,
          totalChunks: params.totalChunks,
          fileSize: params.fileSize,
          fileName: params.fileName,
        },
        "[worker:merge] start",
      );

      await uploadService.runMergeTask(taskId, params, job);
    },
    {
      connection: createBullConnection(MERGE_QUEUE_NAME),
      concurrency: 3,
      limiter: { max: 10, duration: 1000 },

      lockDuration: MERGE_LOCK_DURATION,
      lockRenewTime: MERGE_LOCK_RENEW,
      stalledInterval: MERGE_STALLED_INTERVAL,
      maxStalledCount: MERGE_MAX_STALLED,
    },
  );
}

/* ============================================================
 * 通用事件监听
 * ============================================================ */
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

  // ⭐ 扩充 stalled 日志：带 taskId / uploadId / 已尝试次数
  worker.on("stalled", (jobId) => {
    logger.warn(
      {
        jobId,
        queue: worker.name,
        lockDuration: (worker as any).opts?.lockDuration,
        stalledInterval: (worker as any).opts?.stalledInterval,
      },
      "[worker] job stalled",
    );
  });

  // ⭐ 新增 progress 事件（观测用，可关）
  worker.on("progress", (job, progress) => {
    logger.debug({ jobId: job.id, queue: worker.name, progress }, "[worker] progress");
  });
}

/* ============================================================
 * 优雅退出
 * ============================================================ */
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

    const forceExit = setTimeout(() => {
      logger.error("[worker] shutdown timeout (30s), force exit");
      process.exit(1);
    }, 30_000);
    forceExit.unref();

    try {
      const results = await Promise.allSettled(list.map((w) => w.close()));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        logger.warn(
          { failed: failed.map((r) => (r as any).reason?.message) },
          "[worker] some workers failed to close",
        );
      }

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

  process.on("uncaughtException", (err) => {
    logger.error({ err }, "[worker] uncaughtException");
    void handle("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "[worker] unhandledRejection");
  });
}
