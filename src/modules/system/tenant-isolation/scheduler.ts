import { withPgLock } from "@/core/index.js";
import { TenantIsolationService } from "./service.js";
import { logger } from "@/platform/logger/index.js";

export async function runTenantIsolationScan(): Promise<void> {
  await withPgLock(async () => {
    const service = new TenantIsolationService();
    const result = await service.runFullScan("cron");
    logger.info(result, "[tenant-isolation] cron scan done");
  });
}
