import { prisma } from "@/config/database.js";
import type { Prisma } from "@/generated/prisma/client.js";

export interface DependencyJob {
  job_id: string;
  job_name: string;
  cron_expression: string;
  dependency_job_ids: string[];
  dependency_mode: string | null;
  on_dependency_fail: string | null;
}

/**
 * ✅ JsonValue → string[] 安全转换
 * 支持：数组（过滤非字符串）、字符串（逗号分隔）、null/undefined
 */
export function parseDependencyIds(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export class JobDependencyRepository {
  /** 查询某任务的所有直接上游 */
  async findUpstreams(
    jobId: string,
    tenantId: string,
  ): Promise<DependencyJob[]> {
    const job = await prisma.sys_job.findFirst({
      where: { job_id: jobId, tenant_id: tenantId, is_deleted: 0 },
      select: { dependency_job_ids: true },
    });

    const depIds = parseDependencyIds(job?.dependency_job_ids);
    if (depIds.length === 0) return [];

    const rows = await prisma.sys_job.findMany({
      where: {
        job_id: { in: depIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      select: {
        job_id: true,
        job_name: true,
        cron_expression: true,
        dependency_job_ids: true,
        dependency_mode: true,
        on_dependency_fail: true,
      },
    });

    // ✅ 出口统一转换
    return rows.map<DependencyJob>((r) => ({
      job_id: r.job_id,
      job_name: r.job_name,
      cron_expression: r.cron_expression,
      dependency_job_ids: parseDependencyIds(r.dependency_job_ids),
      dependency_mode: r.dependency_mode ?? "all",
      on_dependency_fail: r.on_dependency_fail ?? "skip",
    }));
  }

  /** 检测依赖环 */
  async detectCycle(jobId: string, tenantId: string): Promise<string[] | null> {
    const visited = new Set<string>();
    const stack: string[] = [];
    const path: string[] = [];

    const dfs = async (current: string): Promise<string[] | null> => {
      if (stack.includes(current)) {
        return [...path.slice(path.indexOf(current)), current];
      }
      if (visited.has(current)) return null;

      visited.add(current);
      stack.push(current);
      path.push(current);

      const job = await prisma.sys_job.findFirst({
        where: { job_id: current, tenant_id: tenantId, is_deleted: 0 },
        select: { dependency_job_ids: true },
      });
      const deps = parseDependencyIds(job?.dependency_job_ids);

      for (const dep of deps) {
        const cycle = await dfs(dep);
        if (cycle) return cycle;
      }

      stack.pop();
      path.pop();
      return null;
    };

    return dfs(jobId);
  }

  /** 最近一次成功的 run */
  async findLastSuccessRun(jobId: string, tenantId: string, withinMs: number) {
    const since = new Date(Date.now() - withinMs);
    return prisma.sys_job_run.findFirst({
      where: {
        job_id: jobId,
        tenant_id: tenantId,
        status: "success",
        started_at: { gte: since },
      },
      orderBy: { started_at: "desc" },
      select: { run_id: true, finished_at: true },
    });
  }

  /** 最近一次失败的 run */
  async findLastFailRun(jobId: string, tenantId: string) {
    return prisma.sys_job_run.findFirst({
      where: { job_id: jobId, tenant_id: tenantId, status: "failed" },
      orderBy: { started_at: "desc" },
      select: { run_id: true, finished_at: true },
    });
  }

  /** 创建 run 记录 */
  async createRun(data: {
    tenantId: string;
    jobId: string;
    triggeredBy: string;
    triggerParent?: string;
  }) {
    return prisma.sys_job_run.create({
      data: {
        tenant_id: data.tenantId,
        job_id: data.jobId,
        triggered_by: data.triggeredBy,
        trigger_parent: data.triggerParent ?? null,
        status: "running",
      },
    });
  }

  /** 完成 run */
  async finishRun(
    runId: string,
    status: "success" | "failed" | "skipped",
    durationMs: number,
    errorMsg?: string,
  ) {
    return prisma.sys_job_run.update({
      where: { run_id: runId },
      data: {
        status,
        finished_at: new Date(),
        duration_ms: durationMs,
        error_msg: errorMsg?.slice(0, 500) ?? null,
      },
    });
  }
}
