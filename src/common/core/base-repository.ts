import { prisma } from "@config/database.js";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export class BaseRepository<T = any> {
  constructor(
    protected model: any, // Prisma model delegate, e.g. prisma.user
    protected defaultOrderBy: Record<string, "asc" | "desc"> = {
      createdAt: "desc",
    },
  ) {}

  async findById(id: string, tenantId: string): Promise<T | null> {
    return this.model.findUnique({ where: { id, tenantId } });
  }

  async findMany(
    tenantId: string,
    page = 1,
    limit = 20,
    where?: Record<string, any>,
  ): Promise<PaginatedResult<T>> {
    const [data, total] = await Promise.all([
      this.model.findMany({
        where: { ...where, tenantId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.defaultOrderBy,
      }),
      this.model.count({ where: { ...where, tenantId } }),
    ]);
    return { data, total, page, limit };
  }

  async create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, tenantId: string, data: Partial<T>): Promise<T> {
    return this.model.update({ where: { id, tenantId }, data });
  }

  async delete(id: string, tenantId: string): Promise<T> {
    return this.model.delete({ where: { id, tenantId } });
  }
}
