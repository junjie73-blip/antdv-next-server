import { JobRepository } from "./repository.js";
import { JobImportRowSchema, JobExportColumns } from "./schema.js";
import { parseExcel, generateExcel } from "@/core/excel/excel.service.js";
import { AppError } from "@/core/errors.js";
import { startJob, stopJob } from "./scheduler.js";
import { BaseService } from "@/core/base/service.js";

export class JobService extends BaseService<JobRepository> {
  constructor(repository: JobRepository) {
    super(repository);
  }
  async pause(jobId: string, tenantId: string) {
    await this.repository.setPaused(jobId, tenantId, true);
    stopJob(jobId);
  }

  async resume(jobId: string, tenantId: string) {
    await this.repository.setPaused(jobId, tenantId, false);
    const job = await this.repository.findById(jobId, tenantId);
    if (job && job.status === "1") startJob(job);
  }

  /** 切换启停 */
  async toggleStatus(
    jobId: string,
    status: string,
    tenantId: string,
  ): Promise<void> {
    await this.repository.updateStatus(jobId, status, tenantId);
    if (status === "1") {
      const job = await this.repository.findById(jobId, tenantId);
      if (job) startJob(job);
    } else {
      stopJob(jobId);
    }
  }

  /** 立即执行 */
  async runOnce(jobId: string, tenantId: string): Promise<void> {
    const job = await this.repository.findById(jobId, tenantId);
    if (!job) throw new AppError("任务不存在", 404001, 404);
    // runJobOnce 内部有锁
    const { runJobOnce } = await import("./scheduler.js");
    await runJobOnce(jobId);
  }

  async exportToExcel(tenantId: string): Promise<Buffer> {
    const jobs = await this.repository.findAllForExport(tenantId);
    return generateExcel(jobs, [...JobExportColumns], "定时任务");
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      JobImportRowSchema,
    );

    const existing = await this.repository.getExistingNames(tenantId);
    const errors = parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`);
    let successCount = 0;

    for (const row of rows) {
      const name = String(row["任务名称"] || "").trim();
      if (!name) continue;
      if (existing.has(name)) {
        errors.push(`任务「${name}」：已存在`);
        continue;
      }

      try {
        await this.repository.insertJob({
          tenantId,
          jobName: name,
          jobGroup: String(row["分组"] || "DEFAULT"),
          invokeTarget: String(row["执行目标"] || ""),
          cronExpression: String(row["Cron表达式"] || ""),
          status: row["状态"] === "停用" ? "0" : "1",
          remark: String(row["备注"] || ""),
          userId,
        });
        existing.add(name);
        successCount++;
      } catch (e: any) {
        errors.push(`任务「${name}」：${e.message}`);
      }
    }

    return { successCount, failCount: errors.length, errors };
  }
}
