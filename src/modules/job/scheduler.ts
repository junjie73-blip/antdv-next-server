import cron, { ScheduledTask } from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { withLock } from "@/core/scheduler/lock.js";

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

  const task = cron.schedule(
    job.cron_expression,
    async () => {
      // 锁 key 带 tenant，避免不同租户同名任务互踩
      const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;
      // 锁 TTL：假设单次执行不会超过 10 分钟
      const LOCK_TTL = 10 * 60;

      const result = await withLock(lockKey, LOCK_TTL, () => runJob(job));
      if (result === null) {
        logger.debug(
          { jobId: job.job_id, name: job.job_name },
          "[job] skipped (lock held by another instance)",
        );
      }
    },
    { timezone: "Asia/Shanghai" },
  );
  running.set(job.job_id, task);
}

export function stopJob(id: string) {
  const t = running.get(id);
  if (t) {
    t.stop();
    running.delete(id);
  }
}

/** 手动立即执行：也走锁 */
export async function runJobOnce(id: string) {
  const job = await prisma.sys_job.findUnique({ where: { job_id: id } });
  if (!job) return;
  const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;
  const result = await withLock(lockKey, 10 * 60, () => runJob(job));
  if (result === null) {
    logger.warn({ jobId: id }, "[job] manual run skipped, lock held");
  }
}

async function runJob(job: any) {
  const start = Date.now();
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
    logger.info(
      { jobId: job.job_id, name: job.job_name, ms: Date.now() - start },
      "[job] success",
    );
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
    logger.error({ err: e, job: job.job_name }, "[job] failed");
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
    case "todo:overdue-notify":
      break;
    default:
      logger.warn(`Unknown invoke_target: ${target}`);
  }
}
