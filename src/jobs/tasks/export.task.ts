import { withPgLock } from "@/core/lock/index.js";
import { ExportService } from "@/modules/export/service.js";
import { logger } from "@/platform/logger/index.js";

export async function runExportCleanup(): Promise<void> {
  await withPgLock(async () => {
    const service = new ExportService();
    const count = await service.cleanupExpired();
    logger.info({ count }, "[export] cron cleanup done");
  });
}

export async function runExportStuckReset(): Promise<void> {
  await withPgLock(async () => {
    const service = new ExportService();
    const count = await service.resetStuck();
    if (count > 0) logger.warn({ count }, "[export] reset stuck");
  });
}

export const EXPORT_JOBS = [
  {
    name: "export-cleanup",
    cron: "0 3 * * *",
    handler: runExportCleanup,
    locked: true,
  },
  {
    name: "export-stuck-reset",
    cron: "*/10 * * * *",
    handler: runExportStuckReset,
    locked: true,
  },
];
