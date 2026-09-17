import { TenantRepository } from "./repository.js";
import { TenantImportRowSchema, TenantExportColumns } from "./schema.js";
import { parseExcel, generateExcel } from "@/core/excel/excel.service.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@core/logger/index.js";
import type { TenantOption } from "./types.js";
import { BaseService } from "@/core/base/service.js";

export class TenantService extends BaseService<TenantRepository> {
  constructor(repository: TenantRepository) {
    super(repository);
  }

  // ============================================================
  // ⭐ 下拉选项（新增）
  // ============================================================

  /**
   * 获取租户下拉选项
   * 返回 [{ tenantId, tenantCode, tenantName }]
   */
  async getOptions(): Promise<TenantOption[]> {
    const options = await this.repository.findOptions();

    logger.debug({ count: options.length }, "[tenant] options fetched");

    return options;
  }

  /**
   * 根据租户编码批量查（用于注册等场景）
   */
  async getOptionsByCodes(codes: string[]): Promise<TenantOption[]> {
    if (!codes || codes.length === 0) return [];
    const all = await this.repository.findOptions({
      onlyEnabled: true,
      limit: 500,
    });
    const codeSet = new Set(codes);
    return all.filter((t) => codeSet.has(t.tenantCode));
  }

  // ============================================================
  // 唯一性校验
  // ============================================================

  async checkBeforeCreate(dto: any): Promise<void> {
    await this.assertUnique(
      () => this.repository.findByTenantCode(dto.tenantCode),
      "租户编码",
      dto.tenantCode,
    );
  }

  async checkBeforeUpdate(id: string, dto: any): Promise<void> {
    if (!dto.tenantCode) return;
    const existing = await this.repository.findByTenantCode(dto.tenantCode, id);
    if (existing) {
      throw new AppError(`租户编码 '${dto.tenantCode}' 已存在`, 409001, 409);
    }
  }

  // ============================================================
  // 导入导出
  // ============================================================

  async exportToExcel(where: any): Promise<Buffer> {
    const tenants = await this.repository.findAllForExport(where);
    return generateExcel(tenants, [...TenantExportColumns], "租户数据");
  }

  async importFromExcel(buffer: Buffer): Promise<{
    successCount: number;
    failCount: number;
    errors: string[];
  }> {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      TenantImportRowSchema,
    );

    if (rows.length === 0) {
      return {
        successCount: 0,
        failCount: parseErrors.length,
        errors: parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`),
      };
    }

    const existing = await this.repository.getExistingCodes();
    const errors: string[] = parseErrors.map(
      (e) => `第 ${e.rowNum} 行：${e.message}`,
    );
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const code = String(row["租户编码"] || "").trim();
      const name = String(row["租户名称"] || "").trim();

      if (!code || !name) {
        errors.push(`第 ${rowNum} 行：编码和名称必填`);
        continue;
      }
      if (existing.has(code)) {
        errors.push(`第 ${rowNum} 行：租户编码「${code}」已存在`);
        continue;
      }

      try {
        const expireRaw = String(row["过期时间"] || "").trim();
        const expireTime = expireRaw ? new Date(expireRaw) : null;

        await this.repository.insertTenant({
          tenantCode: code,
          tenantName: name,
          contactName: String(row["联系人"] || "").trim() || undefined,
          contactPhone: String(row["联系电话"] || "").trim() || undefined,
          contactEmail: String(row["联系邮箱"] || "").trim() || undefined,
          status: row["状态"] === "禁用" ? "0" : "1",
          expireTime,
        });
        existing.add(code);
        successCount++;
      } catch (e: any) {
        errors.push(`第 ${rowNum} 行：${e.message}`);
      }
    }

    return { successCount, failCount: errors.length, errors };
  }
}
