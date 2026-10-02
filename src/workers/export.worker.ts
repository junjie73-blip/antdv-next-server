import { Worker } from "bullmq";
import { createBullConnection } from "@/config/redis.js";
import { ExportRepository } from "@/modules/export/repository.js";
import { ExportExecutor } from "@/modules/export/executor.js";

const repo = new ExportRepository();
const executor = new ExportExecutor(repo);

export const exportWorker = new Worker(
  "export",
  async (job) => {
    const { taskId } = job.data as { taskId: string };
    await executor.execute(taskId);
  },
  {
    connection: createBullConnection("export"),
    concurrency: 2, // 导出较重，避免超过 2
    limiter: { max: 5, duration: 1000 },
  },
);

export default exportWorker;
