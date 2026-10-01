import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { rpExportQueueSize } from "@/platform/metrics/report.js";
import { wfTaskPending } from "@/platform/metrics/workflow.js";

export async function metricsRefreshTask(): Promise<void> {
  try {
    // 1. 导出队列积压（按租户+状态）
    const queueByTenant = await prisma.rp_export_task.groupBy({
      by: ["tenant_id", "status"],
      where: { status: { in: ["pending", "processing"] } },
      _count: { task_id: true },
    });

    rpExportQueueSize.reset();
    for (const row of queueByTenant) {
      rpExportQueueSize
        .labels(row.tenant_id, row.status)
        .set(row._count.task_id);
    }

    // 2. 待办任务数（按租户）
    const pendingByTenant = await prisma.wf_task.groupBy({
      by: ["tenant_id"],
      where: { status: "0", is_deleted: 0 },
      _count: { task_id: true },
    });

    wfTaskPending.reset();
    for (const row of pendingByTenant) {
      wfTaskPending.labels(row.tenant_id).set(row._count.task_id);
    }

    logger.debug(
      { exportQueue: queueByTenant.length, wfPending: pendingByTenant.length },
      "[metrics] 刷新完成",
    );
  } catch (err: any) {
    logger.warn({ err }, "[metrics] 刷新失败");
  }
}
