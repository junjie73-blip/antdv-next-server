import { BaseRepository } from "@/common/core/base-repository.js";
import { prisma } from "@/config/database.js";

export class RoleRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.role);
  }
  async findMany(
    tenantId: string,
    page = 1,
    limit = 20,
    where?: Record<string, any>,
  ) {
    const baseWhere = { tenantId, deletedAt: null, ...where };
    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.role.count({ where: baseWhere }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: any) {
    return prisma.role.create({ data });
  }
  async update(id: string, tenantId: string, data: any) {
    return prisma.role.update({
      where: { id, tenantId, deletedAt: null } as any,
      data: { ...data, updatedAt: new Date() } as any,
    });
  }

  async delete(id: string, tenantId: string) {
    const role = await prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null } as any,
    });
    if (!role) return null;
    if (role.isSystem) throw new Error("系统角色不可删除");
    await prisma.role.update({
      where: { id } as any,
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });
    return { id };
  }

  async assignPermission(
    tenantId: string,
    roleId: string,
    permissionId: string,
  ) {
    return prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.deleteMany({
      where: { roleId, permissionId },
    });
  }
  async findRolePermissions(roleId: string, tenantId: string) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId, deletedAt: null } as any,
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
    if (!role) return [];
    return role.rolePermissions.map((rp: any) => rp.permission);
  }
}
