import { BaseService } from "@/core/base/service.js";
import { UserGroupRepository } from "../repository.js";
import { AppError } from "@/core/errors.js";
import type {
  UserGroupCreateDTO,
  UserGroupUpdateDTO,
  UserGroupListDTO,
} from "../schema.js";
import { MAX_BATCH_MEMBERS, MAX_BATCH_ROLES } from "../constants.js";
import { prisma } from "@/config/database.js";
import { invalidateAllUserCaches } from "@/core/cache/rbac-cache.js";
import { invalidateUsersCache } from "@/modules/rbac/service/permission.service.js";

export class UserGroupService extends BaseService<UserGroupRepository> {
  constructor(repo: UserGroupRepository) {
    super(repo);
  }

  /* ============================================================
   * 列表 / 详情
   * ============================================================ */
  async list(tenantId: string, query: UserGroupListDTO) {
    return this.repository.findPage(query, { tenant_id: tenantId });
  }

  async detail(groupId: string, tenantId: string) {
    const detail = await this.repository.findDetail(groupId, tenantId);
    if (!detail) throw new AppError("用户组不存在", 404001, 404);
    return detail;
  }

  /* ============================================================
   * 创建 / 更新 / 删除
   * ============================================================ */
  async create(dto: UserGroupCreateDTO, tenantId: string, operatorId?: string) {
    await this.assertUnique(
      () => this.repository.findByCode(dto.groupCode, tenantId),
      "组编码",
      dto.groupCode,
    );

    const created = await prisma.sys_user_group.create({
      data: {
        tenant_id: tenantId,
        group_code: dto.groupCode,
        group_name: dto.groupName,
        description: dto.description ?? null,
        group_type: dto.groupType,
        sort_order: dto.sortOrder,
        status: dto.status,
        created_by: operatorId ?? null,
        updated_by: operatorId ?? null,
      },
    });

    this.log("create", { groupId: created.group_id, groupCode: dto.groupCode });
    return created;
  }

  async update(
    groupId: string,
    dto: UserGroupUpdateDTO,
    tenantId: string,
    operatorId?: string,
  ) {
    const group = await this.repository.findById(groupId, tenantId);
    if (!group) throw new AppError("用户组不存在", 404001, 404);

    await this.repository.update(
      groupId,
      {
        group_name: dto.groupName,
        description: dto.description,
        group_type: dto.groupType,
        sort_order: dto.sortOrder,
        status: dto.status,
        updated_by: operatorId,
      },
      tenantId,
      operatorId,
    );

    // 状态变化 → 组可能失效（status=0 时组内角色不生效）
    if (dto.status !== undefined && dto.status !== group.status) {
      const memberIds = await this.repository.findMemberIds(groupId, tenantId);
      await invalidateAllUserCaches(tenantId, memberIds);
      await invalidateUsersCache(memberIds, tenantId);
    }

    this.log("update", { groupId });
  }

  async remove(groupId: string, tenantId: string, operatorId?: string) {
    const group = await this.repository.findById(groupId, tenantId);
    if (!group) throw new AppError("用户组不存在", 404001, 404);

    // ⭐ 先取成员，删除前记录
    const memberIds = await this.repository.findMemberIds(groupId, tenantId);

    await this.repository.softDelete(groupId, tenantId, operatorId);

    // ⭐ 双重失效：组角色 + 权限码
    if (memberIds.length > 0) {
      await invalidateAllUserCaches(tenantId, memberIds);
      await invalidateUsersCache(memberIds, tenantId);
    }

    this.log("remove", { groupId, memberCount: memberIds.length });
  }

  /* ============================================================
   * 成员管理
   * ============================================================ */
  async addMembers(
    groupId: string,
    userIds: string[],
    tenantId: string,
    operatorId?: string,
  ) {
    if (userIds.length > MAX_BATCH_MEMBERS) {
      throw new AppError(
        `单次最多添加 ${MAX_BATCH_MEMBERS} 个成员`,
        400001,
        400,
      );
    }
    const group = await this.repository.findById(groupId, tenantId);
    if (!group) throw new AppError("用户组不存在", 404001, 404);

    await this.repository.assertUsersOwnership(userIds, tenantId);
    const result = await this.repository.addMembers(
      groupId,
      userIds,
      tenantId,
      operatorId,
    );

    // ⭐ 双重失效
    await invalidateAllUserCaches(tenantId, userIds);
    await invalidateUsersCache(userIds, tenantId);

    this.log("addMembers", { groupId, count: result.added });
    return result;
  }

  async removeMembers(
    groupId: string,
    userIds: string[],
    tenantId: string,
    operatorId?: string,
  ) {
    if (userIds.length > MAX_BATCH_MEMBERS) {
      throw new AppError(
        `单次最多移除 ${MAX_BATCH_MEMBERS} 个成员`,
        400001,
        400,
      );
    }
    const group = await this.repository.findById(groupId, tenantId);
    if (!group) throw new AppError("用户组不存在", 404001, 404);

    const result = await this.repository.removeMembers(
      groupId,
      userIds,
      tenantId,
    );

    // ⭐ 双重失效
    await invalidateAllUserCaches(tenantId, userIds);
    await invalidateUsersCache(userIds, tenantId);

    this.log("removeMembers", { groupId, count: result.removed });
    return result;
  }

  /* ============================================================
   * 角色绑定
   * ============================================================ */
  async assignRoles(
    groupId: string,
    roleIds: string[],
    tenantId: string,
    operatorId?: string,
  ) {
    if (roleIds.length > MAX_BATCH_ROLES) {
      throw new AppError(`单次最多绑定 ${MAX_BATCH_ROLES} 个角色`, 400001, 400);
    }
    const group = await this.repository.findById(groupId, tenantId);
    if (!group) throw new AppError("用户组不存在", 404001, 404);

    await this.repository.assertRolesOwnership(roleIds, tenantId);
    const result = await this.repository.syncRoles(
      groupId,
      roleIds,
      tenantId,
      operatorId,
    );

    // ⭐ 组角色变化 → 影响所有成员的权限
    const memberIds = await this.repository.findMemberIds(groupId, tenantId);
    if (memberIds.length > 0) {
      await invalidateAllUserCaches(tenantId, memberIds);
      await invalidateUsersCache(memberIds, tenantId);
    }

    this.log("assignRoles", {
      groupId,
      added: result.added,
      removed: result.removed,
      affectedUsers: memberIds.length,
    });
    return result;
  }

  /* ============================================================
   * 选项
   * ============================================================ */
  async options(tenantId: string) {
    return this.repository.findOptions(tenantId);
  }

  /* ============================================================
   * 供 RBAC 调用（带缓存）
   * ============================================================ */
  async getUserGroupRoleCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const { getGroupRoleCache, setGroupRoleCache } =
      await import("@/core/cache/rbac-cache.js");

    const cached = await getGroupRoleCache(tenantId, userId);
    if (cached !== null) return cached;

    const codes = await this.repository.findUserGroupRoleCodes(
      userId,
      tenantId,
    );
    await setGroupRoleCache(tenantId, userId, codes);
    return codes;
  }
}
