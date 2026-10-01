import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface ReportListParams {
  tenantId?: string;
  userId?: string;
  keyword?: string;
  category?: string;
  pageNum?: number;
  pageSize?: number;
}

export class RpReportRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.rp_report;
  protected readonly primaryKey = "report_id";
  protected readonly tenantField = "tenant_id";

  async findPage(params: ReportListParams) {
    const { tenantId, userId, keyword, category, pageNum, pageSize } = params;

    const where: Prisma.rp_reportWhereInput = {
      tenant_id: tenantId,
      status: "1",
      is_deleted: 0,
    };
    if (keyword) {
      where.OR = [
        { report_name: { contains: keyword } },
        { report_code: { contains: keyword } },
      ];
    }
    if (category) where.category = category;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { updated_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    // 收藏状态
    let favoriteSet = new Set<string>();
    if (userId && list.length > 0) {
      const favorites = await prisma.rp_report_favorite.findMany({
        where: {
          user_id: userId,
          report_id: { in: list.map((r) => r.report_id) },
        },
        select: { report_id: true },
      });
      favoriteSet = new Set(favorites.map((f) => f.report_id));
    }

    return {
      list: list.map((r) => ({
        ...r,
        isFavorite: favoriteSet.has(r.report_id),
      })),
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string, tenantId: string) {
    return this.model.findFirst({
      where: { report_id: id, tenant_id: tenantId, is_deleted: 0 },
      include: { dataset: true },
    });
  }

  async findByCode(code: string, tenantId: string) {
    return this.model.findFirst({
      where: {
        tenant_id: tenantId,
        report_code: code,
        status: "1",
        is_deleted: 0,
      },
      include: { dataset: true },
    });
  }

  async create(data: Prisma.rp_reportUncheckedCreateInput) {
    return this.model.create({ data });
  }

  async update(id: string, data: Prisma.rp_reportUncheckedUpdateInput) {
    return this.model.update({
      where: { report_id: id },
      data: { ...data, updated_at: new Date() },
    });
  }

  async softDelete(id: string, tenantId: string, userId: string) {
    return this.model.updateMany({
      where: { report_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: { is_deleted: 1, updated_at: new Date(), updated_by: userId },
    });
  }

  /* ============================================================
   * 收藏
   * ============================================================ */
  async findFavorite(reportId: string, userId: string) {
    return prisma.rp_report_favorite.findFirst({
      where: { user_id: userId, report_id: reportId },
    });
  }

  async addFavorite(data: {
    tenant_id: string;
    user_id: string;
    report_id: string;
  }) {
    return prisma.rp_report_favorite.create({ data });
  }

  async removeFavorite(id: string) {
    return prisma.rp_report_favorite.delete({ where: { id } });
  }
}
