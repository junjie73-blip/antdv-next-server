import { Worker, type Job } from "bullmq";
import { createBullConnection } from "@/config/redis.js";
import { logger } from "@/platform/logger/index.js";
import { prisma } from "@/config/database.js";
import { UploadService } from "@/modules/upload/service.js";
import { FileRepository } from "@/modules/file/repository.js";
import { MergeJobData, MERGE_QUEUE_NAME } from "@/modules/upload/queue.js";

const uploadService = new UploadService(new FileRepository());

/**
 * 启动 merge Worker
 * - 独立进程运行（src/worker.ts 入口）
 * - concurrency=3，limiter 10/s（保护对象存储）
 * - 优雅退出：等当前任务完成
 */
export function startMergeWorker(): Worker<MergeJobData> {
  const worker = new Worker<MergeJobData>(
    MERGE_QUEUE_NAME,
    async (job: Job<MergeJobData>) => {
      const { taskId, ...params } = job.data;
      logger.info({ taskId, jobId: job.id }, "[worker] merge start");
      await uploadService.runMergeTask(taskId, params, job);
    },
    {
      connection: createBullConnection(MERGE_QUEUE_NAME),
      concurrency: 3,
      limiter: { max: 10, duration: 1000 },
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "[worker] merge completed");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "[worker] merge failed");
  });

  worker.on("error", (err) => {
    logger.error({ err: err.message }, "[worker] worker error");
  });

  return worker;
}

/**
 * Worker 进程的优雅退出
 * - 等待当前任务完成（close 默认会等）
 * - 断开 DB / Redis
 */
export function installWorkerShutdown(worker: Worker): void {
  let shuttingDown = false;

  const handle = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "[worker] shutting down...");

    const forceExit = setTimeout(() => {
      logger.error("[worker] shutdown timeout, force exit");
      process.exit(1);
    }, 30_000);
    forceExit.unref();

    try {
      await worker.close();
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
}
