import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@config/database.js";

export class PermissionRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.permission);
  }

  async findMany(
    tenantId: string,
    page = 1,
    limit = 20,
    where?: Record<string, any>,
  ) {
    const baseWhere = { tenantId, deletedAt: null, ...where };
    const [data, total] = await Promise.all([
      prisma.permission.findMany({
        where: baseWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.permission.count({ where: baseWhere }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: any) {
    return prisma.permission.create({ data });
  }

  async update(id: string, tenantId: string, data: any) {
    return prisma.permission.update({
      where: { id, tenantId, deletedAt: null } as any,
      data: { ...data, updatedAt: new Date() } as any,
    });
  }

  async delete(id: string, tenantId: string) {
    const result = await prisma.permission.deleteMany({
      where: { id, tenantId },
    });
    return result.count > 0 ? { id } : null;
  }
}
