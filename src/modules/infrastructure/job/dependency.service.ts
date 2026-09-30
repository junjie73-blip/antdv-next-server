import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import {
  JobDependencyRepository,
  parseDependencyIds,
} from "./dependency.repository.js";
import { JobRepository } from "./repository.js";
import { prisma } from "@/config/database.js";

const DEP_SUCCESS_WINDOW_MS = 24 * 3600 * 1000;

export interface DependencyCheckResult {
  satisfied: boolean;
  missing: Array<{ jobId: string; jobName: string }>;
  failed: Array<{ jobId: string; jobName: string }>;
}

export class JobDependencyService {
  constructor(
    private readonly depRepo = new JobDependencyRepository(),
    private readonly jobRepo = new JobRepository(),
  ) {}

  /** 校验依赖配置 */
  async validateDependencies(
    jobId: string,
    dependencyJobIds: string[],
    tenantId: string,
  ): Promise<void> {
    if (dependencyJobIds.includes(jobId)) {
      throw new AppError("任务不能依赖自身", 400001, 400);
    }

    // 上游任务存在性
    for (const id of dependencyJobIds) {
      const exists = await this.jobRepo.findById(id, tenantId);
      if (!exists) {
        throw new AppError(`依赖的任务 ${id} 不存在`, 400001, 400);
      }
    }

    // 环检测
    const cycle = await this.depRepo.detectCycle(jobId, tenantId);
    if (cycle) {
      throw new AppError(`检测到任务依赖环：${cycle.join(" → ")}`, 400001, 400);
    }
  }

  /** 检查依赖是否满足 */
  async checkDependencies(
    jobId: string,
    tenantId: string,
  ): Promise<DependencyCheckResult> {
    const job = await this.jobRepo.findById(jobId, tenantId);
    if (!job) throw new AppError("任务不存在", 404001, 404);

    // ✅ 用 parseDependencyIds 统一解析
    const depIds = parseDependencyIds((job as any).dependency_job_ids);
    if (depIds.length === 0) {
      return { satisfied: true, missing: [], failed: [] };
    }

    const upstreams = await this.depRepo.findUpstreams(jobId, tenantId);
    const missing: DependencyCheckResult["missing"] = [];
    const failed: DependencyCheckResult["failed"] = [];

    for (const up of upstreams) {
      const lastRun = await this.depRepo.findLastSuccessRun(
        up.job_id,
        tenantId,
        DEP_SUCCESS_WINDOW_MS,
      );
      if (!lastRun) {
        const lastFail = await this.depRepo.findLastFailRun(
          up.job_id,
          tenantId,
        );
        if (lastFail) {
          failed.push({ jobId: up.job_id, jobName: up.job_name });
        } else {
          missing.push({ jobId: up.job_id, jobName: up.job_name });
        }
      }
    }

    const mode = (job as any).dependency_mode ?? "all";
    const satisfied =
      mode === "any"
        ? missing.length + failed.length < depIds.length
        : missing.length === 0 && failed.length === 0;

    return { satisfied, missing, failed };
  }

  /** 触发下游任务 */
  async triggerDownstreams(
    upstreamJobId: string,
    tenantId: string,
    upstreamRunId: string,
  ): Promise<void> {
    const allJobs = await prisma.sys_job.findMany({
      where: {
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
        is_paused: 0,
      },
      select: { job_id: true, job_name: true, dependency_job_ids: true },
    });

    // ✅ 用 parseDependencyIds 判断
    const targets = allJobs.filter((j) => {
      const ids = parseDependencyIds(j.dependency_job_ids);
      return ids.includes(upstreamJobId);
    });

    if (targets.length === 0) return;

    const { runJobByDependency } = await import("./scheduler.js");

    for (const t of targets) {
      const check = await this.checkDependencies(t.job_id, tenantId);
      if (!check.satisfied) {
        logger.info(
          { jobId: t.job_id, missing: check.missing, failed: check.failed },
          "[job] dependency not satisfied, skip",
        );
        continue;
      }

      try {
        await runJobByDependency(t.job_id, tenantId, upstreamRunId);
      } catch (err) {
        logger.error(
          { err, jobId: t.job_id },
          "[job] trigger downstream failed",
        );
      }
    }
  }
}
