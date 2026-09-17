import cron, { ScheduledTask } from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/core/logger/index.js";
import { withLock } from "@/core/scheduler/lock.js";
import path from "path";
import fs from "fs/promises";
import { UPLOAD_ROOT } from "../upload/controller.js";
import { sendAlert } from "@/core/alert/index.js";
const running = new Map<string, ScheduledTask>();
const failureCounter = new Map<string, number>();
export async function loadJobs(): Promise<number> {
  const list = await prisma.sys_job.findMany({
    where: { status: "1", is_deleted: 0, is_paused: 0 },
  });
  for (const job of list) startJob(job);
  logger.info(`Loaded ${list.length} jobs`);
  return list.length; // ⭐ 返回数量
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
      const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;
      const ttl = Math.min(job.timeout_seconds || 300, 3600);

      await withLock(lockKey, ttl, async () => {
        await prisma.sys_job.update({
          where: { job_id: job.job_id },
          data: { last_run_at: new Date() },
        });
        await runJobWithRetry(job);
      });
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
/** 带重试和超时的执行 */
async function runJobWithRetry(job: any): Promise<void> {
  const maxRetry = job.retry_count || 0;
  const intervalMs = (job.retry_interval || 60) * 1000;
  const timeoutMs = (job.timeout_seconds || 300) * 1000;

  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    const started = Date.now();
    try {
      let timeoutHandle: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`Job timeout after ${timeoutMs}ms`)),
          timeoutMs,
        );
      });

      try {
        await Promise.race([execute(job), timeoutPromise]);
      } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
      }

      // 成功清计数
      failureCounter.delete(job.job_id);

      await prisma.sys_job_log.create({
        data: {
          job_id: job.job_id,
          job_name: job.job_name,
          invoke_target: job.invoke_target,
          job_message: attempt > 0 ? `重试第 ${attempt} 次后成功` : "执行成功",
          status: "1",
          retry_attempt: attempt,
          duration_ms: Date.now() - started,
        },
      });
      return;
    } catch (e: any) {
      const isLast = attempt === maxRetry;
      const isTimeout = String(e?.message || "").includes("timeout");

      // ⭐ 超时告警
      if (isTimeout) {
        void sendAlert({
          level: "warning",
          title: `job_timeout:${job.job_id}`,
          message: `任务「${job.job_name}」超时`,
          source: "job",
          data: { jobId: job.job_id, timeoutMs },
        });
      }

      await prisma.sys_job_log.create({
        data: {
          job_id: job.job_id,
          job_name: job.job_name,
          invoke_target: job.invoke_target,
          job_message: isLast ? "执行失败（已达重试上限）" : "执行失败，将重试",
          status: "0",
          retry_attempt: attempt,
          duration_ms: Date.now() - started,
          exception_info: String(e?.stack || e?.message || e),
        },
      });

      logger.error({ err: e, job: job.job_name, attempt }, "[job] failed");

      if (isLast) {
        // ⭐ 连续失败计数
        const count = (failureCounter.get(job.job_id) || 0) + 1;
        failureCounter.set(job.job_id, count);

        if (count >= 3) {
          void sendAlert({
            level: "warning",
            title: `job_repeated_failure:${job.job_id}`,
            message: `任务「${job.job_name}」连续失败 ${count} 次`,
            source: "job",
            data: {
              jobId: job.job_id,
              jobName: job.job_name,
              error: String(e?.message || e),
            },
          });
        }
      } else {
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
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
    await execute(job.invoke_target);
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
/**
 * 执行任务
 * 入参是整个 job 对象，方便 invoke_target 分支读取 job 自身的配置
 * （如 retention_days、自定义参数等）
 */
async function execute(job: any): Promise<void> {
  const target = job.invoke_target as string;
  const tenantId = job.tenant_id as string;

  switch (target) {
    case "notice:publish": {
      const now = new Date();
      const due = await prisma.sys_notice.findMany({
        where: {
          tenant_id: tenantId,
          status: "0",
          is_deleted: 0,
          publish_time: { lte: now },
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
      // ⭐ 从 job 读保留天数，没有则默认 30
      const retentionDays = Number(
        (job as any).retention_days ?? (job as any).retentionDays ?? 30,
      );
      const before = new Date(Date.now() - retentionDays * 86400000);

      // 清理审计日志
      const auditResult = await prisma.sys_audit_log.deleteMany({
        where: { tenant_id: tenantId, created_at: { lt: before } },
      });

      // 清理任务日志
      const jobLogResult = await prisma.sys_job_log.deleteMany({
        where: { created_at: { lt: before } },
      });

      // 清理登录日志
      const loginLogResult = await prisma.sys_login_log.deleteMany({
        where: { tenant_id: tenantId, created_at: { lt: before } },
      });

      logger.info(
        {
          tenantId,
          retentionDays,
          audit: auditResult.count,
          jobLog: jobLogResult.count,
          loginLog: loginLogResult.count,
        },
        "[job] log:clean done",
      );
      break;
    }

    case "todo:overdue-notify": {
      // 逾期待办提醒（可选扩展）
      const now = new Date();
      const overdueTodos = await prisma.sys_todo.findMany({
        where: {
          tenant_id: tenantId,
          is_deleted: 0,
          status: "0",
          due_time: { lt: now },
        },
        take: 200,
      });

      for (const t of overdueTodos) {
        // TODO: 发送 WS 提醒 / 站内信
        logger.debug({ todoId: t.todo_id }, "[job] overdue todo notify");
      }
      break;
    }
    case "upload:clean-temp": {
      const tempDir = path.join(UPLOAD_ROOT, "temp");
      const dirs = await fs.readdir(tempDir);
      const now = Date.now();
      for (const dir of dirs) {
        const stat = await fs.stat(path.join(tempDir, dir));
        if (now - stat.mtimeMs > 24 * 3600 * 1000) {
          await fs.rm(path.join(tempDir, dir), {
            recursive: true,
            force: true,
          });
        }
      }
      break;
    }
    case "db:backup": {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);
      await execAsync("bash scripts/backup-db.sh", {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      });
      break;
    }
    default:
      logger.warn({ target, jobId: job.job_id }, "[job] unknown invoke_target");
  }
}
