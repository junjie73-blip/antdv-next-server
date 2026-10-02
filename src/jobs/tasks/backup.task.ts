import cron from "node-cron";
import { logger } from "@/platform/logger/index.js";
import { BackupService } from "@/modules/system/backup/service.js";
import { withPgLock } from "@/core/lock/index.js";

/** 按策略执行备份 */
export async function runBackupByPolicy(): Promise<void> {
  await withPgLock(async () => {
    const service = new BackupService();
    const policies = await service.listPolicies();
    const now = new Date();

    for (const p of policies) {
      if (p.enabled !== 1) continue;
      // 简化版：策略的 cron 与当前时刻匹配则触发
      // 生产建议用 job 表管理（sys_job），此处仅演示
      if (!cron.validate(p.cron)) continue;

      // 检查当前分钟是否匹配 cron 表达式
      // node-cron 无直接 match API，可用 cron-parser
      const { CronExpressionParser } = await import("cron-parser");
      const interval = CronExpressionParser.parse(p.cron);
      const prev = interval.prev().toDate();
      // 若上一次触发在当前分钟内，则执行
      if (now.getTime() - prev.getTime() < 60_000) {
        logger.info({ policy: p.name }, "[backup] cron triggered");
        try {
          await service.triggerSync({
            triggerType: "cron",
            backupType: p.backup_type as any,
            retainDays: p.retain_days,
            remark: `自动备份：${p.name}`,
          });
        } catch (err) {
          logger.error({ err, policy: p.name }, "[backup] cron failed");
        }
      }
    }
  });
}

/** 清理过期备份（每天凌晨 4:00） */
export async function runBackupCleanup(): Promise<void> {
  await withPgLock(async () => {
    const service = new BackupService();
    const count = await service.cleanupExpired();
    logger.info({ count }, "[backup] cleanup job done");
  });
}

/** 注册到 scheduler.ts */
export const BACKUP_JOBS = [
  {
    name: "backup-policy-check",
    cron: "* * * * *",
    handler: runBackupByPolicy,
    locked: true,
  },
  {
    name: "backup-cleanup",
    cron: "0 4 * * *",
    handler: runBackupCleanup,
    locked: true,
  },
];
