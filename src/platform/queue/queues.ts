import { createBullConnection } from "@/config/redis.js";
import { Queue } from "bullmq";
/** ⭐ 常量集中管理 */
export const MERGE_LOCK_DURATION = 5 * 60 * 1000; // 5 分钟
export const MERGE_LOCK_RENEW = 30 * 1000; // 每 30s 续期
export const MERGE_STALLED_INTERVAL = 30 * 1000; // 30s 检测一次
export const MERGE_MAX_STALLED = 3; // 容忍 3 次
/** 报表导出队列 */
export const reportExportQueue = new Queue("report-export", {
  connection: createBullConnection("report-export"),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 24 * 3600, count: 200 },
    removeOnFail: { age: 7 * 24 * 3600, count: 500 },
  },
});

/** 工作流通知队列 */
export const wfNotifyQueue = new Queue("wf-notify", {
  connection: createBullConnection("wf-notify"),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 24 * 3600, count: 500 },
    removeOnFail: { age: 3 * 24 * 3600, count: 1000 },
  },
});

/** 报表缓存预热队列 */
export const cacheWarmQueue = new Queue("cache-warm", {
  connection: createBullConnection("cache-warm"),
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { age: 3600, count: 50 },
  },
});
export const exportQueue = new Queue("export", {
  connection: createBullConnection("export-queue"),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
  },
});

export const MERGE_QUEUE_NAME = "upload-merge";

export interface MergeJobData {
  taskId: string;
  uploadId: string;
  fileName: string;
  totalChunks: number;
  tenantId: string;
  userId?: string;
  mimeType?: string;
  fileHash?: string;
  fileSize?: number;
}

export const mergeQueue = new Queue<MergeJobData>(MERGE_QUEUE_NAME, {
  connection: createBullConnection(MERGE_QUEUE_NAME),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600, count: 2000 },
  },
});

export const queueList: Queue[] = [
  reportExportQueue,
  mergeQueue,
  wfNotifyQueue,
  cacheWarmQueue,
  exportQueue,
];
