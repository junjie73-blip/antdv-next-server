import { BaseService } from "@/core/base/service.js";
import { RoleRepository } from "./repository.js";
import { AppError } from "@/core/errors.js";

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
    if (!dto.roleCode) return;
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
}
