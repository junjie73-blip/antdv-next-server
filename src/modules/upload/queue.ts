import { Queue } from "bullmq";
import { createBullConnection, redis } from "@/config/redis.js";

export const MERGE_QUEUE_NAME = "upload-merge";

export interface MergeJobData {
  taskId: string;
  uploadId: string;
  fileName: string;
  totalChunks: number;
  tenantId: string;
  userId?: string;
  mimeType?: string;
}

export const mergeQueue = new Queue<MergeJobData>(MERGE_QUEUE_NAME, {
  connection: createBullConnection(MERGE_QUEUE_NAME),
  defaultJobOptions: {
    attempts: 3, // 失败重试 3 次
    backoff: { type: "exponential", delay: 5000 }, // 5s, 10s, 20s
    removeOnComplete: { age: 24 * 3600, count: 1000 }, // 保留 1 天
    removeOnFail: { age: 7 * 24 * 3600 }, // 失败保留 7 天
  },
});
