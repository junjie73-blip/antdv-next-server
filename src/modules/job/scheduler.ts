import cron, { ScheduledTask } from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";

const running = new Map<string, ScheduledTask>();

export async function loadJobs() {
  const list = await prisma.sys_job.findMany({
    where: { status: "1", is_deleted: 0 },
  });
  for (const job of list) startJob(job);
  logger.info(`Loaded ${list.length} jobs`);
}

export function startJob(job: any) {
  stopJob(job.job_id);
  if (!cron.validate(job.cron_expression)) {
    logger.warn(`Invalid cron: ${job.job_name} -> ${job.cron_expression}`);
    return;
  }
  const task = cron.schedule(job.cron_expression, () => runJob(job), {
    timezone: "Asia/Shanghai",
  });
  running.set(job.job_id, task);
}

export function stopJob(id: string) {
  const t = running.get(id);
  if (t) {
    t.stop();
    running.delete(id);
  }
}

export async function runJobOnce(id: string) {
  const job = await prisma.sys_job.findUnique({ where: { job_id: id } });
  if (job) await runJob(job);
}

async function runJob(job: any) {
  try {
    await execute(job.invoke_target, job.tenant_id);
    await prisma.sys_job_log.create({
      data: {
        job_id: job.job_id,
        job_name: job.job_name,
        invoke_target: job.invoke_target,
        job_message: "执行成功",
        status: "1",
      },
    });
  } catch (e: any) {
    await prisma.sys_job_log.create({
      data: {
        job_id: job.job_id,
        job_name: job.job_name,
        invoke_target: job.invoke_target,
        job_message: "执行失败",
        status: "0",
        exception_info: String(e?.stack || e?.message || e),
      },
    });
    logger.error({ err: e, job: job.job_name }, "job failed");
  }
}

async function execute(target: string, tenantId: string) {
  switch (target) {
    case "notice:publish": {
      const due = await prisma.sys_notice.findMany({
        where: {
          tenant_id: tenantId,
          status: "0",
          publish_time: { lte: new Date() },
          is_deleted: 0,
        },
      });
      for (const n of due) {
        await prisma.sys_notice.update({
          where: { notice_id: n.notice_id },
          data: { status: "1" },
        });
      }
      break;
    }
    case "log:clean": {
      const before = new Date(Date.now() - 30 * 86400000);
      await prisma.sys_audit_log.deleteMany({
        where: { tenant_id: tenantId, created_at: { lt: before } },
      });
      break;
    }
    case "todo:overdue-notify": {
      // 可发通知提醒逾期待办
      break;
    }
    default:
      logger.warn(`Unknown invoke_target: ${target}`);
  }
}
