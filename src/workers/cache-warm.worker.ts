import { Worker } from "bullmq";
import { cacheWarmService } from "@/modules/report/service/cache-warm.service.js";
import { createBullConnection } from "@/config/redis.js";

export const cacheWarmWorker = new Worker(
  "cache-warm",
  async (job) => {
    const { tenantId, adminUserId, reportCode } = job.data;

    if (reportCode) {
      await cacheWarmService.warmOne({
        reportCode,
        tenantId,
        userId: adminUserId,
        username: "system",
        params: {},
      });
    } else {
      await cacheWarmService.warmTenant(tenantId, adminUserId);
    }
  },
  {
    connection: createBullConnection("cache-warm"),
    concurrency: 2,
  },
);

export default cacheWarmWorker;
