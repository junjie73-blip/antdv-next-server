import { withPgLock } from "@/core/lock/index.js";
import { OrgHistoryService } from "@/modules/org-history/services/service.js";
import { OrgSnapshotService } from "@/modules/org-history/services/snapshot.service.js";
import { scanAndTriggerSnapshots } from "@/modules/org-history/snapshot-trigger.js";
import { logger } from "@/platform/logger/index.js";

const LOCK_ID = 7001;

/**
 * 每年 1 月 1 日凌晨 3:00 清理超过 5 年的历史。
 * 如果合规要求保留更久，把 days 加大即可。
 */
export async function cleanupOrgHistory(): Promise<void> {
  await withPgLock(async () => {
    const service = new OrgHistoryService();
    const count = await service.cleanup(365 * 5);
    logger.info({ count }, "[org-history] cleanup done");
  });
}
/** 每月 1 号 00:30 生成快照 */
export async function generateMonthlySnapshot(): Promise<void> {
  await withPgLock(async () => {
    const service = new OrgSnapshotService();
    const count = await service.generateAll();
    logger.info({ tenants: count }, "[org-snapshot] monthly done");
  });
}

/** 每年清理 3 年前的快照 */
export async function cleanupOldSnapshots(): Promise<void> {
  await withPgLock(async () => {
    const service = new OrgSnapshotService();
    const count = await service.cleanup(365 * 3);
    logger.info({ count }, "[org-snapshot] cleanup done");
  });
}
export async function runSnapshotScan(): Promise<void> {
  await withPgLock(async () => {
    await scanAndTriggerSnapshots();
  });
}
export const ORG_HISTORY_JOBS = [
  {
    name: "org-history-cleanup",
    cron: "0 3 1 1 *",
    handler: cleanupOrgHistory,
    locked: true,
  },
  {
    name: "org-snapshot-monthly",
    cron: "30 0 1 * *",
    handler: generateMonthlySnapshot,
    locked: true,
  },
  {
    name: "org-snapshot-cleanup",
    cron: "0 4 1 1 *",
    handler: cleanupOldSnapshots,
    locked: true,
  },
  {
    name: "org-snapshot-scan",
    cron: "0 * * * *",
    handler: runSnapshotScan,
    locked: true,
  },
];
