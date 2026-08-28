import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@config/database.js";

export class UserRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.user);
  }

  async findByUsername(username: string, tenantId: string) {
    return prisma.user.findFirst({
      where: { username, tenantId, deletedAt: null },
    });
  }

  async findWithRoles(id: string, tenantId: string) {
    return prisma.user.findUnique({
      where: { id, tenantId, deletedAt: null } as any,
      include: { userRoles: { include: { role: true } } },
    });
  }

  async updatePassword(id: string, tenantId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id, tenantId, deletedAt: null } as any,
      data: { passwordHash, updatedAt: new Date() },
    });
  }

  async assignRole(userId: string, roleId: string) {
    return prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRole(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  async getUserRoles(userId: string, tenantId: string) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.filter((ur: any) => ur.role?.tenantId === tenantId);
  }
}
