import { PermissionRepository } from "./repository.js";
import {
  PermissionImportRowSchema,
  PermissionExportColumns,
  LABEL_TO_RESOURCE_TYPE,
  needAction,
  PERMISSION_RESOURCE_TYPES,
} from "./schema.js";
import { AppError } from "@/core/errors.js";
import { BaseService } from "@/core/base/service.js";
import { generateExcel, parseExcel } from "@/platform/excel/service.js";
/** 资源类型白名单（防 DTO 被绕过） */
const VALID_RESOURCE_TYPES = new Set<string>(PERMISSION_RESOURCE_TYPES);
export class PermissionService extends BaseService<PermissionRepository> {
  async getAll(tenantId: string) {
    return this.repository.findAll(tenantId);
  }
  constructor(repository: PermissionRepository) {
    super(repository);
  }

  /**
   * ✅ 创建前校验（唯一性 + 资源类型白名单）
   */
  async checkBeforeCreate(dto: any, tenantId: string): Promise<void> {
    // 1) 资源类型白名单
    if (!VALID_RESOURCE_TYPES.has(dto.resourceType)) {
      throw new AppError(
        `不支持的资源类型「${dto.resourceType}」，仅支持 ${[...VALID_RESOURCE_TYPES].join(" / ")}`,
        400001,
        400,
      );
    }

    // 2) perm_code 唯一性
    await this.assertUnique(
      () => this.repository.findByPermCode(dto.permCode, tenantId),
      "权限编码",
      dto.permCode,
    );
  }

  /**
   * ✅ 更新前校验
   */
  async checkBeforeUpdate(
    id: string,
    dto: any,
    tenantId: string,
  ): Promise<void> {
    if (dto.resourceType !== undefined) {
      if (!VALID_RESOURCE_TYPES.has(dto.resourceType)) {
        throw new AppError(
          `不支持的资源类型「${dto.resourceType}」`,
          400001,
          400,
        );
      }
    }

    if (dto.permCode !== undefined) {
      if (dto.permCode === null || dto.permCode === "") {
        throw new AppError("权限编码不能为空", 400001, 400);
      }
      const existing = await this.repository.findByPermCode(
        dto.permCode,
        tenantId,
        id,
      );
      if (existing) {
        throw new AppError(`权限编码 '${dto.permCode}' 已存在`, 409001, 409);
      }
    }
  }
  async exportToExcel(tenantId: string): Promise<Buffer> {
    const perms = await this.repository.findAllForExport(tenantId);
    return generateExcel(perms, [...PermissionExportColumns], "权限数据");
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      PermissionImportRowSchema,
    );
    const existing = await this.repository.getExistingCodes(tenantId);
    const errors = parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`);
    let successCount = 0;

    for (const row of rows) {
      const code = String(row["权限编码"] || "").trim();
      const name = String(row["权限名称"] || "").trim();
      if (!code || !name) continue;
      if (existing.has(code)) {
        errors.push(`权限「${code}」：已存在`);
        continue;
      }
      const resourceLabel = String(row["资源类型"] || "接口").trim();
      const resourceType = LABEL_TO_RESOURCE_TYPE[resourceLabel];
      if (!resourceType) {
        errors.push(
          `权限「${code}」：资源类型「${resourceLabel}」不合法，` +
            `仅支持 接口 / 数据 / 其他`,
        );
        continue;
      }
      const action = String(row["动作"] || "").trim() || null;
      if (needAction(resourceType) && !action) {
        errors.push(
          `权限「${code}」：资源类型「${resourceLabel}」必须指定动作`,
        );
        continue;
      }
      try {
        await this.repository.insertPermission({
          tenantId,
          permCode: code,
          permName: name,
          resourceType: String(row["资源类型"] || "api"),
          perAction: needAction(resourceType) ? action : null,
          description: String(row["描述"] || ""),
          status: row["状态"] === "禁用" ? "0" : "1",
          userId,
        });
        existing.add(code);
        successCount++;
      } catch (e: any) {
        errors.push(`权限「${code}」：${e.message}`);
      }
    }
    return { successCount, failCount: errors.length, errors };
  }
}
