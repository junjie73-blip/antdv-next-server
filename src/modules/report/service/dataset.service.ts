import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { RpDatasetRepository } from "../repository/dataset.repository.js";
import { SqlExecutor } from "./sql-executor.js";
import { ParamResolver } from "./param-resolver.js";
import { ReportCache } from "./report-cache.js";
import type { DatasetCreateDTO, DatasetUpdateDTO } from "../schema.js";
import { prisma } from "@/config/database.js";

export class RpDatasetService {
  private repo = new RpDatasetRepository();

  async list(params: {
    tenantId: string;
    keyword?: string;
    category?: string;
    status?: string;
    pageNum: number;
    pageSize: number;
  }) {
    return this.repo.findPage(params);
  }

  async detail(id: string, tenantId: string) {
    const ds = await this.repo.findById(id, tenantId);
    if (!ds) throw new AppError("数据集不存在", 404001, 404);
    return ds;
  }

  async create(dto: DatasetCreateDTO, tenantId: string, userId: string) {
    // 1. SQL 校验
    const validation = SqlExecutor.validate(dto.sourceConfig.sql);
    if (!validation.valid) {
      throw new AppError(`SQL 校验失败：${validation.error}`, 400001, 400);
    }

    // 2. 编码唯一
    const existing = await this.repo.findByCode(dto.datasetCode, tenantId);
    if (existing) {
      throw new AppError(`数据集编码 ${dto.datasetCode} 已存在`, 400001, 400);
    }

    // 3. 自动补全参数定义
    const params = ParamResolver.autoFillDefs(
      dto.params ?? [],
      dto.sourceConfig.sql,
    );

    // 4. 创建
    const created = await this.repo.create({
      tenant_id: tenantId,
      dataset_code: dto.datasetCode,
      dataset_name: dto.datasetName,
      description: dto.description ?? null,
      category: dto.category ?? null,
      dataset_type: dto.datasetType ?? "sql",
      source_config: dto.sourceConfig as any,
      params: params as any,
      fields: (dto.fields ?? null) as any,
      status: dto.status ?? "1",
      created_by: userId,
      updated_by: userId,
    });

    logger.info(
      { datasetId: created.dataset_id, code: dto.datasetCode },
      "[rp-dataset] 创建成功",
    );

    return created;
  }

  async update(
    id: string,
    dto: DatasetUpdateDTO,
    tenantId: string,
    userId: string,
  ) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("数据集不存在", 404001, 404);

    if (dto.sourceConfig) {
      const validation = SqlExecutor.validate(dto.sourceConfig.sql);
      if (!validation.valid) {
        throw new AppError(`SQL 校验失败：${validation.error}`, 400001, 400);
      }
    }

    await this.repo.update(id, {
      dataset_name: dto.datasetName,
      description: dto.description,
      category: dto.category,
      source_config: dto.sourceConfig as any,
      params: dto.params as any,
      fields: dto.fields as any,
      status: dto.status,
      updated_by: userId,
    });

    // 清缓存
    const reports = await prisma.rp_report.findMany({
      where: { dataset_id: id, is_deleted: 0 },
      select: { report_code: true },
    });
    for (const r of reports) {
      await ReportCache.invalidate(tenantId, r.report_code);
    }

    logger.info({ datasetId: id, tenantId }, "[rp-dataset] 更新成功");
  }

  async remove(id: string, tenantId: string, userId: string) {
    const existing = await this.repo.findById(id, tenantId);
    if (!existing) throw new AppError("数据集不存在", 404001, 404);

    const refCount = await this.repo.countReferencedReports(id);
    if (refCount > 0) {
      throw new AppError(
        `有 ${refCount} 个报表正在使用此数据集，无法删除`,
        400001,
        400,
      );
    }

    await this.repo.softDelete(id, tenantId, userId);
    logger.info({ datasetId: id, tenantId }, "[rp-dataset] 删除成功");
  }

  /**
   * 测试执行
   */
  async test(
    id: string,
    tenantId: string,
    userId: string,
    input: Record<string, any>,
    limit = 100,
  ) {
    const ds = await this.repo.findById(id, tenantId);
    if (!ds) throw new AppError("数据集不存在", 404001, 404);

    const sourceConfig = ds.source_config as any;
    const paramDefs = (ds.params as any[]) ?? [];

    const context = {
      currentUser: { userId, username: "", tenantId },
      now: new Date(),
      today: new Date().toISOString().slice(0, 10),
    };

    const resolved = ParamResolver.resolve(paramDefs, input, context);

    const result = await SqlExecutor.execute({
      sql: sourceConfig.sql,
      variables: resolved,
      tenantId,
      maxRows: limit,
      timeout: 10_000,
      enforceTenant: sourceConfig.enforceTenant,
    });

    const fields =
      result.rows.length > 0
        ? Object.keys(result.rows[0]).map((k) => ({
            name: k,
            type: typeof result.rows[0][k],
            label: k,
          }))
        : [];

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      duration: result.duration,
      fields,
      resolvedParams: resolved,
    };
  }
}
