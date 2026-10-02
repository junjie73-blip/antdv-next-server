import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type {
  UserGroupEntity,
  UserGroupListQuery,
  GroupMember,
  GroupRole,
  GroupDetail,
} from "./types.js";

export interface SyncResult {
  added: number;
  removed: number;
  kept: number;
  total: number;
}

export class UserGroupRepository extends BaseRepository<
  UserGroupEntity,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_user_group;
  protected readonly primaryKey = "group_id";

  /* ============================================================
   * 唯一性校验
   * ============================================================ */
  async findByCode(
    code: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<UserGroupEntity | null> {
    const where: any = {
      tenant_id: tenantId,
      group_code: code,
      is_deleted: 0,
    };
    if (excludeId) where.group_id = { not: excludeId };
    return this.model.findFirst({ where }) as Promise<UserGroupEntity | null>;
  }

  async findById(
    groupId: string,
    tenantId: string,
  ): Promise<UserGroupEntity | null> {
    return this.model.findFirst({
      where: { group_id: groupId, tenant_id: tenantId, is_deleted: 0 },
    }) as Promise<UserGroupEntity | null>;
  }

  /* ============================================================
   * 详情（含成员 + 角色）
   * ============================================================ */
  async findDetail(
    groupId: string,
    tenantId: string,
  ): Promise<GroupDetail | null> {
    const group = await this.findById(groupId, tenantId);
    if (!group) return null;

    const [members, roles, memberCount, roleCount] = await Promise.all([
      this.findMembers(groupId, tenantId),
      this.findRoles(groupId, tenantId),
      prisma.sys_user_group_member.count({
        where: { group_id: groupId, tenant_id: tenantId },
      }),
      prisma.sys_user_group_role.count({
        where: { group_id: groupId, tenant_id: tenantId },
      }),
    ]);

    return {
      ...group,
      members,
      roles,
      memberCount,
      roleCount,
    };
  }

  /* ============================================================
   * 成员查询
   * ============================================================ */
  async findMembers(groupId: string, tenantId: string): Promise<GroupMember[]> {
    const rows = await prisma.sys_user_group_member.findMany({
      where: { group_id: groupId, tenant_id: tenantId },
      select: { user_id: true, joined_at: true },
      orderBy: { joined_at: "asc" },
    });
    if (rows.length === 0) return [];

    const userIds = rows.map((r) => r.user_id);
    const users = await prisma.sys_user.findMany({
      where: {
        user_id: { in: userIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      select: { user_id: true, username: true, real_name: true },
    });
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    return rows.map((r) => {
      const u = userMap.get(r.user_id);
      return {
        user_id: r.user_id,
        username: u?.username ?? "",
        real_name: u?.real_name ?? null,
        joined_at: r.joined_at,
      };
    });
  }

  async findMemberIds(groupId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_user_group_member.findMany({
      where: { group_id: groupId, tenant_id: tenantId },
      select: { user_id: true },
    });
    return rows.map((r) => r.user_id);
  }

  /* ============================================================
   * 角色查询
   * ============================================================ */
  async findRoles(groupId: string, tenantId: string): Promise<GroupRole[]> {
    const rows = await prisma.sys_user_group_role.findMany({
      where: { group_id: groupId, tenant_id: tenantId },
      select: { role_id: true },
    });
    if (rows.length === 0) return [];

    const roleIds = rows.map((r) => r.role_id);
    const roles = await prisma.sys_role.findMany({
      where: {
        role_id: { in: roleIds },
        tenant_id: tenantId,
        is_deleted: 0,
      },
      select: { role_id: true, role_code: true, role_name: true },
    });
    return roles as GroupRole[];
  }

  async findRoleIds(groupId: string, tenantId: string): Promise<string[]> {
    const rows = await prisma.sys_user_group_role.findMany({
      where: { group_id: groupId, tenant_id: tenantId },
      select: { role_id: true },
    });
    return rows.map((r) => r.role_id);
  }

  /* ============================================================
   * 归属校验（ID 必须属于当前租户）
   * ============================================================ */
  async assertUsersOwnership(
    userIds: string[],
    tenantId: string,
  ): Promise<void> {
    if (userIds.length === 0) return;
    const unique = [...new Set(userIds)];
    const count = await prisma.sys_user.count({
      where: {
        user_id: { in: unique },
        tenant_id: tenantId,
        is_deleted: 0,
      },
    });
    if (count !== unique.length) {
      throw new AppError("存在无效的用户 ID", 400001, 400);
    }
  }

  async assertRolesOwnership(
    roleIds: string[],
    tenantId: string,
  ): Promise<void> {
    if (roleIds.length === 0) return;
    const unique = [...new Set(roleIds)];
    const count = await prisma.sys_role.count({
      where: {
        role_id: { in: unique },
        tenant_id: tenantId,
        is_deleted: 0,
      },
    });
    if (count !== unique.length) {
      throw new AppError("存在无效的角色 ID", 400001, 400);
    }
  }

  /* ============================================================
   * 成员变更（差异同步）
   * ============================================================ */
  async addMembers(
    groupId: string,
    userIds: string[],
    tenantId: string,
    operatorId?: string,
  ): Promise<SyncResult> {
    const current = new Set(await this.findMemberIds(groupId, tenantId));
    const toAdd = [...new Set(userIds)].filter((id) => !current.has(id));

    if (toAdd.length > 0) {
      await prisma.sys_user_group_member.createMany({
        data: toAdd.map((userId) => ({
          group_id: groupId,
          user_id: userId,
          tenant_id: tenantId,
          created_by: operatorId ?? null,
        })),
        skipDuplicates: true,
      });
    }

    return {
      added: toAdd.length,
      removed: 0,
      kept: current.size,
      total: current.size + toAdd.length,
    };
  }

  async removeMembers(
    groupId: string,
    userIds: string[],
    tenantId: string,
  ): Promise<SyncResult> {
    const current = new Set(await this.findMemberIds(groupId, tenantId));
    const toRemove = [...new Set(userIds)].filter((id) => current.has(id));

    if (toRemove.length > 0) {
      await prisma.sys_user_group_member.deleteMany({
        where: {
          group_id: groupId,
          tenant_id: tenantId,
          user_id: { in: toRemove },
        },
      });
    }

    return {
      added: 0,
      removed: toRemove.length,
      kept: current.size - toRemove.length,
      total: current.size - toRemove.length,
    };
  }

  /* ============================================================
   * 角色绑定（全量替换）
   * ============================================================ */
  async syncRoles(
    groupId: string,
    roleIds: string[],
    tenantId: string,
    operatorId?: string,
  ): Promise<SyncResult> {
    const current = new Set(await this.findRoleIds(groupId, tenantId));
    const next = new Set([...new Set(roleIds)]);

    const toAdd = [...next].filter((id) => !current.has(id));
    const toRemove = [...current].filter((id) => !next.has(id));

    await prisma.$transaction([
      ...(toRemove.length > 0
        ? [
            prisma.sys_user_group_role.deleteMany({
              where: {
                group_id: groupId,
                tenant_id: tenantId,
                role_id: { in: toRemove },
              },
            }),
          ]
        : []),
      ...(toAdd.length > 0
        ? [
            prisma.sys_user_group_role.createMany({
              data: toAdd.map((roleId) => ({
                group_id: groupId,
                role_id: roleId,
                tenant_id: tenantId,
                created_by: operatorId ?? null,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return {
      added: toAdd.length,
      removed: toRemove.length,
      kept: next.size - toAdd.length,
      total: next.size,
    };
  }

  /* ============================================================
   * 删除（软删 + 级联清理）
   * ============================================================ */
  async softDelete(
    groupId: string,
    tenantId: string,
    operatorId?: string,
  ): Promise<UserGroupEntity> {
    const exists = await this.findById(groupId, tenantId);
    if (!exists) throw new AppError("用户组不存在", 404001, 404);

    return prisma.$transaction(async (tx) => {
      await tx.sys_user_group_member.deleteMany({
        where: { group_id: groupId, tenant_id: tenantId },
      });
      await tx.sys_user_group_role.deleteMany({
        where: { group_id: groupId, tenant_id: tenantId },
      });
      return tx.sys_user_group.update({
        where: { group_id: groupId },
        data: {
          is_deleted: 1,
          updated_by: operatorId ?? null,
          updated_at: new Date(),
        },
      });
    }) as Promise<UserGroupEntity>;
  }

  /* ============================================================
   * 选项（下拉）
   * ============================================================ */
  async findOptions(tenantId: string) {
    const rows = await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: "1",
        is_deleted: 0,
      },
      select: { group_id: true, group_code: true, group_name: true },
      orderBy: { sort_order: "asc" },
    });
    return rows.map((r: any) => ({
      label: r.group_name,
      value: r.group_id,
      code: r.group_code,
    }));
  }

  /* ============================================================
   * 供 RBAC 使用：查用户的所有组角色
   * ============================================================ */
  async findUserGroupRoleIds(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const rows = await prisma.sys_user_group_role.findMany({
      where: {
        tenant_id: tenantId,
        group: {
          tenant_id: tenantId,
          is_deleted: 0,
          status: "1",
          members: {
            some: { user_id: userId, tenant_id: tenantId },
          },
        },
      },
      select: { role_id: true },
    });
    return [...new Set(rows.map((r) => r.role_id))];
  }

  async findUserGroupRoleCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const roleIds = await this.findUserGroupRoleIds(userId, tenantId);
    if (roleIds.length === 0) return [];
    const roles = await prisma.sys_role.findMany({
      where: {
        role_id: { in: roleIds },
        tenant_id: tenantId,
        is_deleted: 0,
        status: "1",
      },
      select: { role_code: true },
    });
    return roles.map((r) => r.role_code);
  }
}
