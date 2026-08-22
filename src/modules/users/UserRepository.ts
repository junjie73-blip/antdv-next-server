import { prisma } from "@config/database.js";
import type { CreateUserRequest } from "./UserModel.js";

export class UserRepository {
  async findById(id: string, tenantId: string) {
    return prisma.user.findUnique({ where: { id, tenantId } });
  }

  async findMany(tenantId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);
    return { data, total, page, limit };
  }

  async create(payload: CreateUserRequest) {
    return prisma.user.create({ data: payload });
  }

  async delete(id: string, tenantId: string) {
    return prisma.user.delete({ where: { id, tenantId } });
  }
}
