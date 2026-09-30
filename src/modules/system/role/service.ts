import { BaseService } from "@/core/base/service.js";
import { RoleRepository } from "./repository.js";
import { AppError, NotFoundError } from "@/core/errors.js";
import { prisma } from "@/config/index.js";
import { computeDataScope, toWhereScope } from "@/middleware/index.js";

export class RoleService extends BaseService<RoleRepository> {
  constructor(repository: RoleRepository) {
    super(repository);
  }

  async checkBeforeCreate(dto: any, tenantId: string) {
    await this.assertUnique(
      () => this.repository.findByRoleCode(dto.roleCode, tenantId),
      "角色编码",
      dto.roleCode,
    );
  }

  async checkBeforeUpdate(id: string, dto: any, tenantId: string) {
    if (dto.roleCode === undefined) return;
    const existing = await this.repository.findByRoleCode(
      dto.roleCode,
      tenantId,
      id,
    );
    if (existing)
      throw new AppError(`角色编码 '${dto.roleCode}' 已存在`, 409001, 409);
  }

  async checkBeforeDelete(roleId: string, tenantId: string) {
    const count = await this.repository.countUsersByRole(roleId, tenantId);
    if (count > 0) {
      throw new AppError(
        `该角色已分配给 ${count} 个用户，无法删除`,
        400001,
        400,
      );
    }
  }
  async getRoleOptions(tenantId: string) {
    const roles = await this.repository.findRoleOptions(tenantId);
    return roles.map((r: any) => ({
      label: r.role_name,
      value: r.role_id,
    }));
  }

  /**
   * 数据权限预览
   * @param sampleUserId 样本用户 ID（必须是当前租户的用户）
   */
  async previewDataScope(
    tenantId: string,
    sampleUserId: string,
    sampleCount = 20,
  ) {
    // 若无此方法，用现有 findByUsername 之类 → 这里简化：
    const sampleUser = await prisma.sys_user.findFirst({
      where: { user_id: sampleUserId, tenant_id: tenantId, is_deleted: 0 },
      select: { user_id: true, username: true, real_name: true },
    });
    if (!sampleUser) throw new NotFoundError("样本用户不存在");

    // 2) 计算数据权限范围
    const ctx = await computeDataScope(sampleUserId, tenantId);
    const whereScope = toWhereScope(ctx);

    // 3) 采样
    const [sampleUsers, total] = await Promise.all([
      this.repository.findUsersForDataScopePreview(
        tenantId,
        whereScope,
        sampleCount,
      ),
      this.repository.countUsersForDataScopePreview(tenantId, whereScope),
    ]);

    return { ctx, sampleUsers, total };
  }
}
