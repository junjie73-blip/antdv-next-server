import { logger } from "@/platform/logger/index.js";
import { OrgSnapshotService } from "./services/index.js";
import { prisma } from "@/config/database.js";
export const SNAPSHOT_TRIGGER_THRESHOLD = 50; // 单次/窗口内变更数
export const SNAPSHOT_WINDOW_MS = 60 * 60_000; // 1 小时窗口
const THRESHOLD = 50;
const DEDUP_TTL_MS = 30 * 60_000; // 30 分钟内不重复触发

// 进程内去重（多实例场景由 DB 快照的 upsert 幂等性兜底）
const lastTriggered = new Map<string, number>();

export async function maybeTriggerSnapshot(
  tenantId: string,
  changedCount: number,
  meta: { trigger: "app" | "cron" | "manual"; reason?: string } = {
    trigger: "app",
  },
): Promise<boolean> {
  if (changedCount < THRESHOLD) return false;

  // 去重：30 分钟内不重复
  const last = lastTriggered.get(tenantId);
  if (last && Date.now() - last < DEDUP_TTL_MS) {
    logger.debug(
      { tenantId, changedCount },
      "[org-snapshot] 跳过（近期已触发）",
    );
    return false;
  }

  lastTriggered.set(tenantId, Date.now());

  try {
    const service = new OrgSnapshotService();
    await service.generateForTenant(tenantId);
    logger.info(
      { tenantId, changedCount, trigger: meta.trigger, reason: meta.reason },
      "[org-snapshot] 大调整已触发快照",
    );
    return true;
  } catch (err) {
    logger.error({ err, tenantId }, "[org-snapshot] 触发失败");
    return false;
  }
}

/**
 * 巡检：扫描最近 N 小时的变更，超阈值补快照。
 * 用于 cron 兜底（进程崩溃 / 应用层漏调）。
 */
export async function scanAndTriggerSnapshots(): Promise<number> {
  const since = new Date(Date.now() - 60 * 60_000);

  const rows = await prisma.$queryRaw<
    Array<{ tenant_id: string; count: bigint }>
  >`
    SELECT tenant_id, COUNT(*)::bigint AS count
    FROM sys_org_history
    WHERE entity_type = 'user_dept'
      AND created_at >= ${since}
    GROUP BY tenant_id
    HAVING COUNT(*) >= ${THRESHOLD}
  `;

  let triggered = 0;
  for (const r of rows) {
    const ok = await maybeTriggerSnapshot(r.tenant_id, Number(r.count), {
      trigger: "cron",
      reason: "window_scan",
    });
    if (ok) triggered++;
  }

  logger.info({ tenants: rows.length, triggered }, "[org-snapshot] 巡检完成");
  return triggered;
}
