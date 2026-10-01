import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { RpReportRepository } from "../repository/report.repository.js";
import { reportEngine } from "./engine.js";
import { ReportCache } from "./report-cache.js";
import type { ReportCreateDTO, ReportUpdateDTO } from "../schema.js";

export class RpReportService {
  private repo = new RpReportRepository();

  /* ============================================================
   * 列表
   * ============================================================ */
  async list(params: {
    tenantId: string;
    userId: string;
    keyword?: string;
    category?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.findPage(params, {});
  }

  /* ============================================================
   * 详情
   * ============================================================ */
  async detail(id: string, tenantId: string) {
    const report = await this.repo.findById(id, tenantId);
    if (!report) throw new AppError("报表不存在", 404001, 404);
    return report;
  }

  async detailByCode(code: string, tenantId: string) {
    const report = await this.repo.findByCode(code, tenantId);
    if (!report) throw new AppError("报表不存在", 404001, 404);
    return report;
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  async create(dto: ReportCreateDTO, tenantId: string, userId: string) {
    // 校验数据集
    const dataset = await prisma.rp_dataset.findFirst({
      where: {
        dataset_id: dto.datasetId,
        tenant_id: tenantId,
        is_deleted: 0,
      },
    });
    if (!dataset) throw new AppError("数据集不存在", 404001, 404);

    // 编码唯一
    const existing = await prisma.rp_report.findFirst({
      where: {
        tenant_id: tenantId,
        report_code: dto.reportCode,
        is_deleted: 0,
      },
    });
    if (existing) {
      throw new AppError(`报表编码 ${dto.reportCode} 已存在`, 400001, 400);
    }

    const created = await this.repo.create({
      tenant_id: tenantId,
      report_code: dto.reportCode,
      report_name: dto.reportName,
      description: dto.description ?? null,
      category: dto.category ?? null,
      dataset_id: dto.datasetId,
      config: (dto.config ?? null) as any,
      params: (dto.params ?? null) as any,
      allowed_roles: (dto.allowedRoles ?? null) as any,
      status: dto.status ?? "1",
      created_by: userId,
      updated_by: userId,
    });

    logger.info(
      { reportId: created.report_id, code: dto.reportCode },
      "[rp-report] 创建成功",
    );

    return created;
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  async update(
    id: string,
    dto: ReportUpdateDTO,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("报表不存在", 404001, 404);

    if (dto.datasetId) {
      const dataset = await prisma.rp_dataset.findFirst({
        where: {
          dataset_id: dto.datasetId,
          tenant_id: tenantId,
          is_deleted: 0,
        },
      });
      if (!dataset) throw new AppError("数据集不存在", 404001, 404);
    }

    await this.repo.update(id, {
      report_name: dto.reportName,
      description: dto.description,
      category: dto.category,
      dataset_id: dto.datasetId,
      config: dto.config as any,
      params: dto.params as any,
      allowed_roles: dto.allowedRoles as any,
      status: dto.status,
      updated_by: userId,
    });

    await ReportCache.invalidate(tenantId, existing.report_code);

    logger.info({ reportId: id, tenantId }, "[rp-report] 更新成功");
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  async remove(id: string, tenantId: string, userId: string) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("报表不存在", 404001, 404);

    await this.repo.softDelete(id, tenantId, userId);
    await ReportCache.invalidate(tenantId, existing.report_code);

    logger.info({ reportId: id, tenantId }, "[rp-report] 删除成功");
  }

  /* ============================================================
   * 执行
   * ============================================================ */
  async execute(params: {
    reportCode: string;
    tenantId: string;
    userId: string;
    username: string;
    deptId?: string | null;
    roles?: string[];
    input: Record<string, any>;
    useCache?: boolean;
  }) {
    return reportEngine.execute(params);
  }

  /* ============================================================
   * 收藏
   * ============================================================ */
  async toggleFavorite(reportId: string, tenantId: string, userId: string) {
    const report = await this.repo.findById(reportId, tenantId);
    if (!report) throw new AppError("报表不存在", 404001, 404);

    const existing = await this.repo.findFavorite(reportId, userId);

    if (existing) {
      await this.repo.removeFavorite(existing.id);
      return { isFavorite: false };
    }

    await this.repo.addFavorite({
      tenant_id: tenantId,
      user_id: userId,
      report_id: reportId,
    });
    return { isFavorite: true };
  }

  /* ============================================================
   * 清缓存
   * ============================================================ */
  async clearCache(reportCode: string, tenantId: string) {
    await ReportCache.invalidate(tenantId, reportCode);
    logger.info({ reportCode, tenantId }, "[rp-report] 缓存已清除");
  }
}
