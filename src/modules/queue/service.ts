import type { Job, JobType, Queue } from "bullmq";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { queueList } from "@/platform/queue/queues.js";
import {
  CLEANABLE_STATUS,
  CleanableStatus,
  JOB_STATUS_LIST,
  MAX_CLEAN_LIMIT,
  QUEUE_DISPLAY_NAME,
  VALID_JOB_STATUS,
  type JobStatus,
} from "./constants.js";

/** 队列 Job 列表参数 */
export interface ListJobsParams {
  status?: JobStatus;
  pageNum: number;
  pageSize: number;
  keyword?: string;
}

export class QueueMonitorService {
  /* ============================================================
   * 概览
   * ============================================================ */
  async overview() {
    const results = await Promise.all(
      queueList.map(async (q) => {
        try {
          const [counts, isPaused] = await Promise.all([
            q.getJobCounts(
              "wait",
              "active",
              "completed",
              "failed",
              "delayed",
              "paused" as JobType,
            ),
            q.isPaused(),
          ]);

          return {
            name: q.name,
            displayName: QUEUE_DISPLAY_NAME[q.name] ?? q.name,
            counts: {
              wait: counts.wait ?? 0,
              active: counts.active ?? 0,
              completed: counts.completed ?? 0,
              failed: counts.failed ?? 0,
              delayed: counts.delayed ?? 0,
              paused: counts.paused ?? 0,
            },
            isPaused,
            workers: await this.countWorkers(q),
          };
        } catch (err) {
          logger.error(
            { err, queue: q.name },
            "[monitor:queue] overview failed",
          );
          return {
            name: q.name,
            displayName: QUEUE_DISPLAY_NAME[q.name] ?? q.name,
            counts: {
              wait: 0,
              active: 0,
              completed: 0,
              failed: 0,
              delayed: 0,
              paused: 0,
            },
            isPaused: false,
            workers: 0,
          };
        }
      }),
    );
    return results;
  }

  /* ============================================================
   * Job 列表
   * ============================================================ */
  async listJobs(queueName: string, params: ListJobsParams) {
    const q = this.getQueue(queueName);
    const status = params.status ?? "failed";
    if (!VALID_JOB_STATUS.has(status)) {
      throw new AppError(`不支持的状态：${status}`, 400001, 400);
    }

    const { pageNum, pageSize } = params;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize - 1;

    const [jobs, total] = await Promise.all([
      q.getJobs([status as any], start, end, false),
      q.getJobCountByTypes(status as JobType),
    ]);

    // 按状态映射 job → dto（保留 status 字段）
    const list = jobs.map((j) => this.toJobDto(j, status));

    // 关键词过滤（前端传了 keyword 时，额外过滤 jobId）
    const filtered = params.keyword
      ? list.filter((j) => j.id?.includes(params.keyword!))
      : list;

    return { list: filtered, total };
  }

  /* ============================================================
   * Job 详情
   * ============================================================ */
  async getJobDetail(queueName: string, jobId: string) {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) throw new AppError("Job 不存在", 404001, 404);

    const status = await this.detectJobStatus(job);
    return this.toJobDto(job, status);
  }

  /* ============================================================
   * 重试（重新入队）
   * ============================================================ */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) throw new AppError("Job 不存在", 404001, 404);

    // BullMQ v4/v5：job.retry() 把任务重新放回 wait 队列
    await job.retry();
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const q = this.getQueue(queueName);
    const job = await q.getJob(jobId);
    if (!job) throw new AppError("Job 不存在", 404001, 404);

    await job.remove();
  }

  /* ============================================================
   * 暂停 / 恢复
   * ============================================================ */
  async pause(queueName: string): Promise<void> {
    const q = this.getQueue(queueName);
    await q.pause();
    logger.info({ queue: queueName }, "[monitor:queue] paused");
  }

  async resume(queueName: string): Promise<void> {
    const q = this.getQueue(queueName);
    await q.resume();
    logger.info({ queue: queueName }, "[monitor:queue] resumed");
  }

  /* ============================================================
   * 清理（bulk）
   * ============================================================ */
  async clean(
    queueName: string,
    status: CleanableStatus,
    limit: number,
  ): Promise<{ removed: string[] }> {
    if (!CLEANABLE_STATUS.has(status)) {
      throw new AppError(
        `不支持清理的状态：${status}（允许：completed / failed / delayed / wait）`,
        400001,
        400,
      );
    }
    const safeLimit = Math.min(Math.max(1, limit), MAX_CLEAN_LIMIT);
    const q = this.getQueue(queueName);

    // grace = 0 → 立即清理
    const removed = await q.clean(0, safeLimit, status);
    logger.info(
      { queue: queueName, status: status as JobType, removed },
      "[monitor:queue] cleaned",
    );
    return { removed };
  }

  /* ============================================================
   * 内部
   * ============================================================ */
  private getQueue(name: string): Queue {
    const q = queueList.find((x) => x.name === name);
    if (!q) throw new AppError(`队列不存在：${name}`, 404001, 404);
    return q;
  }

  private async countWorkers(q: Queue): Promise<number> {
    try {
      // BullMQ v5+ 会读 Redis 中的 worker 心跳
      const workers = await (q as any).getWorkers?.();
      return Array.isArray(workers) ? workers.length : 0;
    } catch {
      return 0;
    }
  }

  /** 判断 job 当前处于哪个状态 */
  private async detectJobStatus(job: Job): Promise<string> {
    try {
      if (await job.isCompleted()) return "completed";
      if (await job.isFailed()) return "failed";
      if (await job.isActive()) return "active";
      if (await job.isDelayed()) return "delayed";
      if (await job.isWaiting()) return "waiting";
    } catch {
      /* ignore */
    }
    return "unknown";
  }

  /** job → dto */
  private toJobDto(job: Job, status: string) {
    const duration =
      job.processedOn && job.finishedOn
        ? job.finishedOn - job.processedOn
        : null;

    return {
      id: job.id,
      name: job.name,
      status,
      progress: job.progress ?? 0,
      attemptsMade: job.attemptsMade ?? 0,
      maxAttempts: (job.opts?.attempts as number) ?? 1,
      data: job.data,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason ?? null,
      stacktrace: job.stacktrace ?? [],
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
      duration,
      delayedUntil: (job as any).delay ?? null,
    };
  }
}

export const queueMonitorService = new QueueMonitorService();
