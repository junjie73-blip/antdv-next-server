import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface DatasetListParams {
  tenantId?: string;
  keyword?: string;
  category?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}

export class RpDatasetRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.rp_dataset;
  protected readonly primaryKey = "dataset_id";
  protected readonly tenantField = "tenant_id";

  async findPage(params: DatasetListParams) {
    const { tenantId, keyword, category, status, pageNum, pageSize } = params;

    const where: Prisma.rp_datasetWhereInput = {
      tenant_id: tenantId,
      is_deleted: 0,
    };
    if (keyword) {
      where.OR = [
        { dataset_name: { contains: keyword } },
        { dataset_code: { contains: keyword } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [list, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy: { updated_at: "desc" },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      this.model.count({ where }),
    ]);

    return {
      list,
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string, tenantId: string) {
    return this.model.findFirst({
      where: { dataset_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async findByCode(code: string, tenantId: string) {
    return this.model.findFirst({
      where: { tenant_id: tenantId, dataset_code: code, is_deleted: 0 },
    });
  }

  async create(data: Prisma.rp_datasetUncheckedCreateInput) {
    return this.model.create({ data });
  }

  async update(id: string, data: Prisma.rp_datasetUncheckedUpdateInput) {
    return this.model.update({
      where: { dataset_id: id },
      data: { ...data, updated_at: new Date() },
    });
  }

  async softDelete(id: string, tenantId: string, userId: string) {
    return this.model.updateMany({
      where: { dataset_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: { is_deleted: 1, updated_at: new Date(), updated_by: userId },
    });
  }

  /** 该数据集被多少个报表引用 */
  async countReferencedReports(datasetId: string): Promise<number> {
    return prisma.rp_report.count({
      where: { dataset_id: datasetId, is_deleted: 0 },
    });
  }
}
