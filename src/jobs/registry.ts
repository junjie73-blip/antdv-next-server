import { logger } from "@/platform/logger/index.js";
import { workflowTimeoutTask } from "./tasks/workflow-timeout.task.js";
import { reportCacheWarmTask } from "./tasks/report-cache-warm.task.js";
import { cleanupExpiredExports } from "./tasks/report-export-cleanup.task.js";
import { exportRetryTask } from "./tasks/export-retry.task.js";
import { runFileCleanupTask } from "./tasks/file-cleanup.task.js";
import { runDbSlowQueryReviewTask } from "./tasks/db-slow-query-review.task.js";
import { runAuditCleanTask } from "./tasks/audit-clean.task.js";
import { runAuditDailyTask } from "./tasks/audit-daily.task.js";
import { runPartitionMonitorTask } from "./tasks/partition-monitor.task.js";
import { runMessageCleanupTask } from "./tasks/message-cleanup.task.js";
import { runWfCcCleanupTask } from "./tasks/wf-cc-cleanup.task.js";
import { runSlowQueryCleanupTask } from "./tasks/slow-query-cleanup.task.js";
import { runSlowQueryAlertTask } from "./tasks/slow-query-alert.task.js";
import { runStorageHealthTask } from "./tasks/storage-health.task.js";

/** 定时任务处理器 */
export const JOB_HANDLERS: Record<string, () => Promise<void>> = {
  /* ============================================================
   * 工作流
   * ============================================================ */
  workflowTimeoutJob: workflowTimeoutTask,

  /* ============================================================
   * 报表
   * ============================================================ */
  reportCacheWarmJob: reportCacheWarmTask,
  exportCleanupJob: cleanupExpiredExports,
  exportRetryJob: exportRetryTask,

  /* ============================================================
   * 文件 / 监控
   * ============================================================ */
  fileCleanupJob: async () => {
    await runFileCleanupTask();
  },
  dbSlowQueryReviewJob: async () => {
    await runDbSlowQueryReviewTask();
  },
  partitionMonitorJob: async () => {
    await runPartitionMonitorTask();
  },

  /* ============================================================
   * 审计
   * ============================================================ */
  auditDailyJob: async () => {
    await runAuditDailyTask();
  },
  auditCleanJob: async () => {
    await runAuditCleanTask();
  },

  /* ============================================================
   * 指标
   * ============================================================ */
  metricsRefreshJob: async () => {
    const { metricsRefreshTask } =
      await import("./tasks/metrics-refresh.task.js");
    await metricsRefreshTask();
  },
  messageCleanupJob: runMessageCleanupTask,
  wfCcCleanupJob: runWfCcCleanupTask,
  slowQueryCleanupJob: async () => {
    await runSlowQueryCleanupTask();
  },
  slowQueryAlertJob: async () => {
    await runSlowQueryAlertTask();
  },
  storageHealthJob: runStorageHealthTask,
};

/**
 * 执行定时任务
 */
export async function runJob(invokeTarget: string): Promise<void> {
  const handler = JOB_HANDLERS[invokeTarget];
  if (!handler) {
    logger.warn({ invokeTarget }, "[job] 未注册的任务");
    return;
  }

  try {
    await handler();
  } catch (err: any) {
    logger.error({ err, invokeTarget }, "[job] 执行失败");
    throw err;
  }
}
