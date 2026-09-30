import { DeptRepository } from "./repository.js";
import { DeptImportRowSchema, DeptExportColumns } from "./schema.js";
import { AppError } from "@/core/errors.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { BaseService } from "@/core/base/service.js";
import {
  generateExcel,
  parseExcel,
  importTreeData,
} from "@/platform/excel/service.js";
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

/** 判断是否为"根节点"parentId */
export function isRootParentId(parentId: unknown): boolean {
  if (parentId === null || parentId === undefined) return true;
  if (typeof parentId !== "string") return false;
  const trimmed = parentId.trim();
  if (trimmed === "") return true;
  if (trimmed === ZERO_UUID) return true;
  return false;
}
export class DeptService extends BaseService<DeptRepository> {
  constructor(repository: DeptRepository) {
    super(repository);
  }

  // ============================================================
  // 树（从 Repository 移过来的无状态算法）
  // ============================================================

  buildTree(items: any[], parentId: string | null = null): any[] {
    const isRootCall = parentId === null;

    return items
      .filter((item) => {
        const pid = item.parent_id;
        if (isRootCall) {
          return isRootParentId(pid);
        }
        return pid === parentId;
      })
      .map((item) => {
        const node: any = { ...keysToCamelCase(item) };
        const children = this.buildTree(items, item.dept_id);
        if (children.length > 0) {
          node.children = children;
        } else {
          // ✅ 空 children 不注入
          delete node.children;
        }
        return node;
      });
  }

  async getTree(tenantId: string, options: { onlyEnabled?: boolean } = {}) {
    const depts = await this.repository.findAllByTenant(tenantId, options);
    return this.buildTree(depts, null);
  }

  // ============================================================
  // 唯一性校验
  // ============================================================

  async checkBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.repository.findByDeptCode(dto.deptCode, tenantId),
      "部门编码",
      dto.deptCode,
    );

    // ⭐ 若传了 leaderId，校验用户存在
    if (dto.leaderId) {
      const user = await this.repository.findUserById(dto.leaderId, tenantId);
      if (!user) throw new AppError("指定的负责人用户不存在", 400, 400);
    }
  }

  async checkBeforeUpdate(id: string, dto: any, tenantId: string) {
    if (dto.deptCode) {
      const existing = await this.repository.findByDeptCode(
        dto.deptCode,
        tenantId,
        id,
      );
      if (existing) {
        throw new AppError(`部门编码 '${dto.deptCode}' 已存在`, 409001, 409);
      }
    }

    // ⭐ 若传了 leaderId，校验用户存在
    if (dto.leaderId) {
      const user = await this.repository.findUserById(dto.leaderId, tenantId);
      if (!user) throw new AppError("指定的负责人用户不存在", 400, 400);
    }
  }

  // ============================================================
  // 关联用户
  // ============================================================

  async updateDeptUsers(deptId: string, userIds: string[], tenantId: string) {
    await this.assertExists(deptId, tenantId, "部门");
    await this.repository.updateDeptUsers(deptId, userIds, tenantId);
    this.log("updateDeptUsers", { deptId, count: userIds.length });
  }

  async getDeptUsers(deptId: string, tenantId: string) {
    return this.repository.findDeptUsers(deptId, tenantId);
  }

  // ============================================================
  // 导入导出
  // ============================================================

  async exportToExcel(tenantId: string): Promise<Buffer> {
    const depts = await this.repository.findAllForExport(tenantId);
    return generateExcel(depts, [...DeptExportColumns], "部门数据");
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const { rows, errors: parseErrors } = parseExcel<Record<string, any>>(
      buffer,
      DeptImportRowSchema,
    );

    if (rows.length === 0) {
      return {
        successCount: 0,
        failCount: parseErrors.length,
        errors: parseErrors.map((e) => `第 ${e.rowNum} 行：${e.message}`),
      };
    }

    const existingMap = await this.repository.getCodeToIdMap(tenantId);
    const errors: string[] = parseErrors.map(
      (e) => `第 ${e.rowNum} 行：${e.message}`,
    );
    let successCount = 0;

    const rowsToInsert = rows.map((raw) => ({
      deptCode: raw["部门编码"] as string,
      deptName: raw["部门名称"] as string,
      parentCode: (raw["上级部门编码"] || "").trim(),
      leader: raw["负责人"] || "", // ⭐ 交给 repo 反查 leader_id
      phone: raw["联系电话"] || "",
      email: raw["邮箱"] || "",
      sortOrder: raw["排序"] ?? 0,
      status: raw["状态"] === "禁用" ? "0" : "1",
    }));

    const { successCount: inserted, errors: insertErrors } =
      await importTreeData(
        rowsToInsert,
        (r) => r.deptCode,
        (r) => r.parentCode,
        async (row, parentId) => {
          if (existingMap.has(row.deptCode)) {
            throw new AppError(
              `部门编码「${row.deptCode}」已存在`,
              409001,
              409,
            );
          }
          return this.repository.insertDept({
            tenantId,
            parentId,
            ...row,
            userId,
          });
        },
      );

    successCount += inserted;
    insertErrors.forEach((e) =>
      errors.push(`部门「${e.row.deptCode}」：${e.message}`),
    );

    return { successCount, failCount: errors.length, errors };
  }
}
