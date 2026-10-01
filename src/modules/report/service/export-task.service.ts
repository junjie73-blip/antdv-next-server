import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { exportQueue } from "@/platform/queue/queues.js";
import { RpExportTaskRepository } from "../repository/export-task.repository.js";
import type { ExportType } from "../types.js";
import { deleteFileByUrl } from "@/platform/storage/factory.js";

export class RpExportTaskService {
  private repo = new RpExportTaskRepository();

  /**
   * 创建异步导出任务
   */
  async create(params: {
    tenantId: string;
    userId: string;
    reportCode: string;
    exportType: ExportType;
    input: Record<string, any>;
    filename?: string;
  }) {
    // 1. 创建任务
    const task = await this.repo.create({
      tenant_id: params.tenantId,
      user_id: params.userId,
      report_code: params.reportCode,
      export_type: params.exportType,
      params: {
        input: params.input,
        filename: params.filename,
      } as any,
      status: "pending",
    });

    // 2. 入队
    const job = await exportQueue.add(
      "export",
      {
        taskId: task.task_id,
        tenantId: params.tenantId,
        userId: params.userId,
        reportCode: params.reportCode,
        exportType: params.exportType,
        input: params.input,
        filename: params.filename,
      },
      {
        jobId: `export-${task.task_id}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    );

    // 3. 回写 jobId
    await this.repo.update(task.task_id, { job_id: String(job.id) });

    logger.info(
      {
        taskId: task.task_id,
        reportCode: params.reportCode,
        exportType: params.exportType,
      },
      "[rp-export] 任务已入队",
    );

    return task;
  }

  /**
   * 我的导出任务列表
   */
  async list(params: {
    tenantId: string;
    userId: string;
    status?: string;
    reportCode?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.findPage(params, {});
  }

  /**
   * 详情
   */
  async detail(taskId: string, tenantId: string, userId: string) {
    const task = await this.repo.findByIdForUser(taskId, tenantId, userId);
    if (!task) throw new AppError("导出任务不存在", 404001, 404);
    return task;
  }

  /**
   * 取消
   */
  async cancel(taskId: string, tenantId: string, userId: string) {
    const task = await this.repo.findByIdForUser(taskId, tenantId, userId);
    if (!task) throw new AppError("导出任务不存在", 404001, 404);

    if (!["pending", "processing"].includes(task.status)) {
      throw new AppError("只能取消待处理或处理中的任务", 400001, 400);
    }

    // 移除队列 job
    if (task.job_id) {
      const job = await exportQueue.getJob(task.job_id);
      if (job) await job.remove().catch(() => undefined);
    }

    await this.repo.update(taskId, { status: "cancelled" });

    logger.info({ taskId, tenantId }, "[rp-export] 已取消");
  }

  /**
   * 重试
   */
  async retry(taskId: string, tenantId: string, userId: string) {
    const task = await this.repo.findByIdForUser(taskId, tenantId, userId);
    if (!task) throw new AppError("导出任务不存在", 404001, 404);

    if (task.status !== "failed") {
      throw new AppError("只能重试失败的任务", 400001, 400);
    }

    const paramsData = task.params as any;

    // 重置状态 + 重新入队
    await this.repo.update(taskId, {
      status: "pending",
      progress: 0,
      retry_count: 0,
      next_retry_at: null,
      error_msg: null,
      error_type: null,
      error_stack: null,
      started_at: null,
      completed_at: null,
    });

    await exportQueue.add(
      "export",
      {
        taskId: task.task_id,
        tenantId,
        userId,
        reportCode: task.report_code,
        exportType: task.export_type,
        input: paramsData?.input ?? {},
        filename: paramsData?.filename,
      },
      {
        jobId: `export-${task.task_id}-manual-${Date.now()}`,
        attempts: 1,
      },
    );

    logger.info({ taskId, tenantId }, "[rp-export] 已重试");
  }
  /**
   * 统计面板数据
   */
  async stats(params: { tenantId: string; userId: string }) {
    const baseWhere = {
      tenant_id: params.tenantId,
      user_id: params.userId,
    };

    const [pending, processing, completed, failed, cancelled, retrying] =
      await Promise.all([
        prisma.rp_export_task.count({
          where: { ...baseWhere, status: "pending" },
        }),
        prisma.rp_export_task.count({
          where: { ...baseWhere, status: "processing" },
        }),
        prisma.rp_export_task.count({
          where: { ...baseWhere, status: "completed" },
        }),
        prisma.rp_export_task.count({
          where: { ...baseWhere, status: "failed" },
        }),
        prisma.rp_export_task.count({
          where: { ...baseWhere, status: "cancelled" },
        }),
        prisma.rp_export_task.count({
          where: {
            ...baseWhere,
            status: "pending",
            next_retry_at: { not: null },
          },
        }),
      ]);

    // 今日完成
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCompleted = await prisma.rp_export_task.count({
      where: {
        ...baseWhere,
        status: "completed",
        completed_at: { gte: todayStart },
      },
    });

    // 总文件大小（字节）
    const totalSize = await prisma.rp_export_task.aggregate({
      where: { ...baseWhere, status: "completed" },
      _sum: { file_size: true },
    });

    // 平均耗时
    const avgDuration = await prisma.rp_export_task.aggregate({
      where: { ...baseWhere, status: "completed", duration_ms: { not: null } },
      _avg: { duration_ms: true },
    });

    return {
      pending,
      processing,
      completed,
      failed,
      cancelled,
      retrying,
      todayCompleted,
      totalSize: Number(totalSize._sum.file_size ?? 0),
      avgDuration: Math.round(avgDuration._avg.duration_ms ?? 0),
    };
  }

  /**
   * 趋势数据（按天聚合）
   */
  async trend(params: { tenantId: string; userId: string; days: number }) {
    const start = new Date();
    start.setDate(start.getDate() - params.days + 1);
    start.setHours(0, 0, 0, 0);

    // 一次性查所有，内存聚合
    const tasks = await prisma.rp_export_task.findMany({
      where: {
        tenant_id: params.tenantId,
        user_id: params.userId,
        created_at: { gte: start },
      },
      select: {
        created_at: true,
        status: true,
        export_type: true,
        duration_ms: true,
      },
    });

    // 初始化日期槽
    const buckets = new Map<
      string,
      {
        date: string;
        total: number;
        completed: number;
        failed: number;
        avgDuration: number;
        durationSum: number;
        durationCount: number;
      }
    >();

    for (let i = 0; i < params.days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, {
        date: key,
        total: 0,
        completed: 0,
        failed: 0,
        avgDuration: 0,
        durationSum: 0,
        durationCount: 0,
      });
    }

    for (const task of tasks) {
      const key = task.created_at.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      bucket.total++;
      if (task.status === "completed") bucket.completed++;
      if (task.status === "failed") bucket.failed++;

      if (task.duration_ms) {
        bucket.durationSum += task.duration_ms;
        bucket.durationCount++;
      }
    }

    const list = [...buckets.values()].map((b) => ({
      date: b.date,
      total: b.total,
      completed: b.completed,
      failed: b.failed,
      avgDuration:
        b.durationCount > 0 ? Math.round(b.durationSum / b.durationCount) : 0,
    }));

    return { list };
  }
  async remove(taskId: string, tenantId: string, userId: string) {
    const task = await this.repo.findByIdForUser(taskId, tenantId, userId);
    if (!task) throw new AppError("导出任务不存在", 404001, 404);

    // 进行中的任务不允许删除
    if (["pending", "processing"].includes(task.status)) {
      throw new AppError("请先取消任务再删除", 400001, 400);
    }

    // 删除物理文件
    if (task.file_url) {
      await deleteFileByUrl(tenantId, task.file_url).catch(() => undefined);
    }

    // 硬删除
    await prisma.rp_export_task.delete({
      where: { task_id: taskId },
    });

    logger.info({ taskId, tenantId }, "[rp-export] 已删除");
  }
}
