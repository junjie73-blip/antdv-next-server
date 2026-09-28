import { ConfigRepository } from "./repository.js";
import { ConfigImportRowSchema, ConfigExportColumns } from "./schema.js";
import { AppError } from "@/core/errors.js";
import { BaseService } from "@/core/base/service.js";
import { generateExcel, parseExcel } from "@/platform/excel/service.js";

export class ConfigService extends BaseService<any> {
  constructor(repository: ConfigRepository) {
    super(repository);
  }

  async exportToExcel(tenantId: string): Promise<Buffer> {
    const configs = await this.repository.findAllForExport(tenantId);
    return generateExcel(configs, [...ConfigExportColumns], "系统配置");
  }
  async checkBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.repository.findByKey(dto.configKey, tenantId),
      "配置键",
      dto.configKey,
    );
  }

  async checkBeforeUpdate(id: string, dto: any, tenantId: string) {
    if (!dto.configKey) return;
    const existing = await this.repository.findByKey(
      dto.configKey,
      tenantId,
      id,
    );
    if (existing) {
      throw new AppError(`配置键 '${dto.configKey}' 已存在`, 409001, 409);
    }
  }

  async getByKey(key: string, tenantId: string) {
    const config = await this.repository.findByKey(key, tenantId);
    if (!config) throw new AppError("配置不存在", 404001, 404);
    return config.config_value;
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      ConfigImportRowSchema,
    );

    const errors = parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`);
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = String(row["配置键"] || "").trim();
      if (!key) continue;

      try {
        // ⭐ upsert：已存在则更新，不存在则创建
        await this.repository.upsertByKey({
          tenantId,
          configKey: key,
          configValue: String(row["配置值"] || ""),
          description: String(row["描述"] || ""),
          userId,
        });
        successCount++;
      } catch (e: any) {
        errors.push(`配置「${key}」：${e.message}`);
      }
    }

    return { successCount, failCount: errors.length, errors };
  }
}
