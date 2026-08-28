import { prisma } from "@config/database.js";

export class UserRoleRepository {
  async findByUser(userId: string) {
    return prisma.userRole.findMany({
      where: { userId },
      include: { role: true, user: true },
    });
  }

  async findByRole(roleId: string) {
    return prisma.userRole.findMany({
      where: { roleId },
      include: { user: true, role: true },
    });
  }

  async create(data: { userId: string; roleId: string }) {
    return prisma.userRole.create({ data: data as any });
  }

  async delete(userId: string, roleId: string) {
    return prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
  }
}
