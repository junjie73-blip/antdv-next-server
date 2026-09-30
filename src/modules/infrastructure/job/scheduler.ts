import cron, { ScheduledTask } from "node-cron";
import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import path from "path";
import fs from "fs/promises";
import { UPLOAD_ROOT } from "../upload/controller.js";
import { sendAlert } from "@/platform/alert/index.js";
import { withLock } from "@/core/index.js";
import { dispatchNotice } from "@/modules/notice/channels/index.js";
import { JobRepository } from "./repository.js";
import { runAuditCleanTask } from "@/jobs/tasks/audit-clean.task.js";
import { runAuditDailyTask } from "@/jobs/tasks/audit-daily.task.js";

const running = new Map<string, ScheduledTask>();
const repo = new JobRepository();

/* ============================================================
 * 启动时加载所有任务
 * ============================================================ */
export async function loadJobs(): Promise<number> {
  const list = await prisma.sys_job.findMany({
    where: { status: "1", is_deleted: 0, is_paused: 0 },
  });
  for (const job of list) startJob(job);
  logger.info(`Loaded ${list.length} jobs`);
  return list.length;
}

export function startJob(job: any) {
  stopJob(job.job_id);
  if (!cron.validate(job.cron_expression)) {
    logger.warn(`Invalid cron: ${job.job_name} -> ${job.cron_expression}`);
    return;
  }

  const perAttempt = (job.timeout_seconds || 300) * 1000;
  const retries = job.retry_count || 0;
  const intervalMs = (job.retry_interval || 60) * 1000;
  const worstMs = perAttempt * (retries + 1) + intervalMs * retries;
  const ttl = Math.min(Math.ceil(worstMs / 1000) + 30, 7200);
  const task = cron.schedule(
    job.cron_expression,
    async () => {
      const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;

      await withLock(lockKey, ttl, async () => {
        const latest = await prisma.sys_job.findUnique({
          where: { job_id: job.job_id },
        });
        if (!latest || latest.is_deleted === 1 || latest.status !== "1") {
          logger.debug({ jobId: job.job_id }, "[job] skipped, job not active");
          return;
        }

        await prisma.sys_job.update({
          where: { job_id: job.job_id },
          data: { last_run_at: new Date() },
        });

        await runJobWithRetry(latest);
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

/* ============================================================
 * 带重试和超时的执行
 * ============================================================ */
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

      /* ========== 执行成功 ========== */

      // 1. 记录成功日志
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

      // ⭐ 2. 重置失败计数
      await repo.resetFailCount(job.job_id);

      logger.info(
        { jobId: job.job_id, name: job.job_name, attempt },
        "[job] success",
      );
      return;
    } catch (e: any) {
      const isLast = attempt === maxRetry;
      const isTimeout = String(e?.message || "").includes("timeout");

      /* ⭐ 超时走平台告警（不占用户渠道） */
      if (isTimeout) {
        void sendPlatformAlert({
          level: "warning",
          title: `job_timeout:${job.job_id}`,
          message: `任务「${job.job_name}」超时（${timeoutMs}ms）`,
          source: "job",
          data: { jobId: job.job_id, timeoutMs, attempt },
        });
      }

      // 记录失败日志
      await prisma.sys_job_log.create({
        data: {
          job_id: job.job_id,
          job_name: job.job_name,
          invoke_target: job.invoke_target,
          job_message: isLast
            ? "执行失败（已达重试上限）"
            : `执行失败，${intervalMs / 1000}s 后重试`,
          status: "0",
          retry_attempt: attempt,
          duration_ms: Date.now() - started,
          exception_info: String(e?.stack || e?.message || e),
        },
      });

      logger.error({ err: e, job: job.job_name, attempt }, "[job] failed");

      if (isLast) {
        /* ⭐ 最后一次失败：更新计数 + 判断是否触发告警 */
        await handleJobFailure(job, e, attempt);
      } else {
        /* 中间重试：等待间隔 */
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    }
  }
}

/* ============================================================
 * ⭐ 处理任务失败（持久化计数 + 阈值 + 告警）
 * ============================================================ */
async function handleJobFailure(
  job: any,
  err: any,
  attempt: number,
): Promise<void> {
  // 1. 计数 +1（持久化到数据库）
  let newCount = 0;
  try {
    newCount = await repo.incrementFailCount(job.job_id);
  } catch (e) {
    logger.error(
      { err: e, jobId: job.job_id },
      "[job] increment fail count failed",
    );
    return;
  }

  // 2. 未开启告警 → 只计数，不通知
  if (job.alert_enabled !== 1) {
    logger.debug(
      { jobId: job.job_id, failCount: newCount },
      "[job] alert disabled",
    );
    return;
  }

  // 3. 阈值判断
  const threshold = job.alert_threshold ?? 3;
  if (newCount < threshold) {
    logger.debug(
      { jobId: job.job_id, failCount: newCount, threshold },
      "[job] fail count below threshold",
    );
    return;
  }

  // 4. 触发告警
  try {
    await sendJobAlert(job, {
      failCount: newCount,
      threshold,
      lastError: String(err?.message || err),
      lastRunAt: new Date(),
      attempt,
    });

    // ⭐ 告警成功后重置计数，避免"每失败一次就发一次"
    await repo.resetFailCount(job.job_id);

    logger.info(
      { jobId: job.job_id, failCount: newCount, threshold },
      "[job] alert sent, fail count reset",
    );
  } catch (alertErr) {
    logger.error(
      { err: alertErr, jobId: job.job_id },
      "[job] send alert failed",
    );
  }
}

/* ============================================================
 * ⭐ 任务告警：走通知系统（用户渠道配置）
 * ============================================================ */
async function sendJobAlert(
  job: any,
  ctx: {
    failCount: number;
    threshold: number;
    lastError: string;
    lastRunAt: Date;
    attempt: number;
  },
): Promise<void> {
  const channels = (job.alert_channels ?? "email")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const receivers = (job.alert_receivers ?? "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  if (receivers.length === 0) {
    logger.warn({ jobId: job.job_id }, "[job] alert receivers empty, skip");
    return;
  }

  const title = `【任务告警】${job.job_name} 连续失败 ${ctx.failCount} 次`;
  const content = [
    `任务名称：${job.job_name}`,
    `任务分组：${job.job_group || "DEFAULT"}`,
    `执行目标：${job.invoke_target}`,
    `Cron 表达式：${job.cron_expression}`,
    `连续失败：${ctx.failCount} 次（阈值 ${ctx.threshold}）`,
    `重试次数：${ctx.attempt}`,
    `最近执行：${ctx.lastRunAt.toISOString()}`,
    ``,
    `最近错误：`,
    ctx.lastError,
    ``,
    `请及时检查任务配置或依赖服务，避免影响业务。`,
  ].join("\n");

  // 按渠道分发相同的接收人
  const receiversByChannel: Record<string, string[]> = {};
  for (const ch of channels) {
    receiversByChannel[ch] = receivers;
  }

  await dispatchNotice({
    tenantId: job.tenant_id,
    title,
    content,
    channels,
    receiversByChannel,
  });
}

/* ============================================================
 * ⭐ 平台告警（超时/系统级，不依赖租户渠道）
 * ============================================================ */
async function sendPlatformAlert(input: {
  level: "info" | "warning" | "error";
  title: string;
  message: string;
  source: string;
  data: Record<string, any>;
}): Promise<void> {
  try {
    await sendAlert(input);
  } catch (e) {
    logger.error({ err: e }, "[job] send platform alert failed");
  }
}

/* ============================================================
 * 手动执行
 * ============================================================ */
export async function runJobOnce(id: string) {
  const job = await prisma.sys_job.findUnique({ where: { job_id: id } });
  if (!job) return;

  const lockKey = `job:lock:${job.tenant_id}:${job.job_id}`;
  const result = await withLock(lockKey, 10 * 60, () => runJobManually(job));

  if (result === null) {
    logger.warn({ jobId: id }, "[job] manual run skipped, lock held");
  }
}

/**
 * ⭐ 手动执行：独立逻辑
 * - 有超时保护
 * - 记录日志
 * - 不更新 fail_count（避免误触发告警）
 */
async function runJobManually(job: any): Promise<void> {
  const start = Date.now();
  const timeoutMs = (job.timeout_seconds || 300) * 1000;
  let timeoutHandle: NodeJS.Timeout | null = null;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`Job timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    try {
      // ⭐ 修正：传 job 对象而非字符串
      await Promise.race([execute(job), timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    await prisma.sys_job_log.create({
      data: {
        job_id: job.job_id,
        job_name: job.job_name,
        invoke_target: job.invoke_target,
        job_message: "手动执行成功",
        status: "1",
        duration_ms: Date.now() - start,
      },
    });

    logger.info(
      { jobId: job.job_id, name: job.job_name, ms: Date.now() - start },
      "[job] manual success",
    );
  } catch (e: any) {
    await prisma.sys_job_log.create({
      data: {
        job_id: job.job_id,
        job_name: job.job_name,
        invoke_target: job.invoke_target,
        job_message: "手动执行失败",
        status: "0",
        duration_ms: Date.now() - start,
        exception_info: String(e?.stack || e?.message || e),
      },
    });

    logger.error({ err: e, job: job.job_name }, "[job] manual failed");
    // ⭐ 注意：手动失败不触发连续失败计数
  }
}

/* ============================================================
 * execute：任务分发（保留原逻辑）
 * ============================================================ */
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
      const retentionDays = Number(
        (job as any).retention_days ?? (job as any).retentionDays ?? 30,
      );
      const before = new Date(Date.now() - retentionDays * 86400000);

      // ✅ 先取本租户 job_id，job_log 无 tenant_id
      const tenantJobs = await prisma.sys_job.findMany({
        where: { tenant_id: tenantId, is_deleted: 0 },
        select: { job_id: true },
      });
      const jobIds = tenantJobs.map((j) => j.job_id);

      const [auditResult, loginLogResult, jobLogResult] = await Promise.all([
        prisma.sys_audit_log.deleteMany({
          where: { tenant_id: tenantId, created_at: { lt: before } },
        }),
        prisma.sys_login_log.deleteMany({
          where: { tenant_id: tenantId, created_at: { lt: before } },
        }),
        jobIds.length > 0
          ? prisma.sys_job_log.deleteMany({
              where: {
                job_id: { in: jobIds },
                created_at: { lt: before },
              },
            })
          : Promise.resolve({ count: 0 }),
      ]);

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
    case "audit:daily":
      await runAuditDailyTask();
      break;

    // ⭐ 审计日报清理
    case "audit:clean-daily":
      await runAuditCleanTask();
      break;
    default:
      logger.warn({ target, jobId: job.job_id }, "[job] unknown invoke_target");
  }
}
