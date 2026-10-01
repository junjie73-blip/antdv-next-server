import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { wfNotificationService } from "@/modules/workflow/service/notification.service.js";
import { workflowEngine } from "@/modules/workflow/service/engine.js";
import type { WfDefinitionJSON } from "@/modules/workflow/types.js";

const BATCH_SIZE = 100;
const MAX_SCAN_PER_RUN = 1000;

/**
 * 扫描超时任务
 * - 每 1 分钟执行一次
 * - 超时任务：status=0 且 due_at <= now
 * - 按节点 timeout.action 处理
 */
export async function workflowTimeoutTask(): Promise<void> {
  const start = Date.now();
  const now = new Date();

  // 1. 分批查询超时任务
  const timeoutTasks = await prisma.wf_task.findMany({
    where: {
      status: "0",
      is_deleted: 0,
      due_at: { lte: now },
    },
    take: MAX_SCAN_PER_RUN,
    orderBy: { due_at: "asc" },
  });

  if (timeoutTasks.length === 0) {
    logger.debug("[wf-timeout] 无超时任务");
    return;
  }

  logger.info({ count: timeoutTasks.length }, "[wf-timeout] 发现超时任务");

  // 2. 缓存实例和定义（避免重复查询）
  const instanceIds = [...new Set(timeoutTasks.map((t) => t.instance_id))];

  const [instances, history] = await Promise.all([
    prisma.wf_instance.findMany({
      where: { instance_id: { in: instanceIds } },
    }),
    prisma.wf_history.findMany({
      where: {
        instance_id: { in: instanceIds },
        event_type: "start",
      },
      select: { instance_id: true, node_id: true },
    }),
  ]);

  const instanceMap = new Map(instances.map((i) => [i.instance_id, i]));
  const historySet = new Set(
    history.map((h) => `${h.instance_id}:${h.node_id}`),
  );

  // 3. 定义缓存
  const defIds = [...new Set(instances.map((i) => i.def_id))];
  const defs = await prisma.wf_definition.findMany({
    where: { def_id: { in: defIds } },
    select: { def_id: true, definition: true },
  });
  const defMap = new Map(
    defs.map((d) => [d.def_id, d.definition as unknown as WfDefinitionJSON]),
  );

  // 4. 逐个处理
  let notified = 0;
  let autoApproved = 0;
  let autoRejected = 0;
  let skipped = 0;

  for (const task of timeoutTasks) {
    try {
      const instance = instanceMap.get(task.instance_id);
      if (!instance) {
        skipped++;
        continue;
      }

      const definition = defMap.get(instance.def_id);
      if (!definition) {
        skipped++;
        continue;
      }

      const node = definition.nodes.find((n) => n.id === task.node_id);
      if (!node?.timeout) {
        skipped++;
        continue;
      }

      const action = node.timeout.action;

      // 4.1 发送超时通知
      const receiverIds: string[] = [];
      if (task.assignee_id) receiverIds.push(task.assignee_id);
      const candidates = (task.candidate_ids as string[]) ?? [];
      receiverIds.push(...candidates);

      if (receiverIds.length > 0) {
        await wfNotificationService.notify({
          tenantId: task.tenant_id,
          instanceId: task.instance_id,
          taskId: task.task_id,
          nodeId: task.node_id,
          eventType: "timeout",
          receiverIds: [...new Set(receiverIds)],
        });
        notified++;
      }

      // 4.2 按配置处理
      switch (action) {
        case "notify":
          // 只通知，不改状态
          break;

        case "autoApprove":
          // 自动通过
          await autoCompleteTask(task, instance, "approve", "超时自动通过");
          autoApproved++;
          break;

        case "autoReject":
          // 自动驳回
          await autoCompleteTask(task, instance, "reject", "超时自动驳回");
          autoRejected++;
          break;
      }
    } catch (err: any) {
      logger.error(
        { err, taskId: task.task_id, instanceId: task.instance_id },
        "[wf-timeout] 处理失败",
      );
    }
  }

  const duration = Date.now() - start;

  logger.info(
    {
      total: timeoutTasks.length,
      notified,
      autoApproved,
      autoRejected,
      skipped,
      duration,
    },
    "[wf-timeout] 扫描完成",
  );
}

/* ============================================================
 * 自动通过/驳回
 * ============================================================ */
async function autoCompleteTask(
  task: any,
  instance: any,
  action: "approve" | "reject",
  comment: string,
): Promise<void> {
  // 通过 workflowEngine 走完整流程（含状态流转）
  // 用系统用户作为操作者
  const systemUserId = instance.initiator_id; // 兜底

  try {
    await workflowEngine.completeTask({
      taskId: task.task_id,
      tenantId: task.tenant_id,
      userId: systemUserId,
      action,
      comment,
    });

    logger.info({ taskId: task.task_id, action }, "[wf-timeout] 自动处理成功");
  } catch (err: any) {
    logger.error(
      { err, taskId: task.task_id, action },
      "[wf-timeout] 自动处理失败",
    );
    throw err;
  }
}
