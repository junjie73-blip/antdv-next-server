import { prisma } from "@/config/database.js";
import { Prisma } from "@/generated/prisma/client.js";
import { BaseRepository } from "@/core/index.js";

export interface DefinitionListParams {
  tenantId?: string;
  keyword?: string;
  category?: string;
  status?: string;
  pageNum?: number;
  pageSize?: number;
}

export class WfDefinitionRepository extends BaseRepository<any, any, any, any> {
  protected readonly model = prisma.wf_definition;
  protected readonly primaryKey = "def_id";
  protected readonly tenantField = "tenant_id";

  /* ============================================================
   * 详情（含 XML）
   * ============================================================ */
  async findById(id: string, tenantId: string) {
    return this.model.findFirst({
      where: { def_id: id, tenant_id: tenantId, is_deleted: 0 },
    });
  }

  async findLatestByKey(defKey: string, tenantId: string) {
    return this.model.findFirst({
      where: {
        tenant_id: tenantId,
        def_key: defKey,
        status: "1",
        is_deleted: 0,
      },
      orderBy: { version: "desc" },
    });
  }

  async findByKeyAndVersion(defKey: string, version: number, tenantId: string) {
    return this.model.findFirst({
      where: {
        tenant_id: tenantId,
        def_key: defKey,
        version,
        is_deleted: 0,
      },
    });
  }

  /* ============================================================
   * 创建 / 更新 / 删除
   * ============================================================ */
  async create(data: Prisma.wf_definitionUncheckedCreateInput) {
    return this.model.create({ data });
  }

  async update(id: string, data: Prisma.wf_definitionUncheckedUpdateInput) {
    return this.model.update({
      where: { def_id: id },
      data: { ...data, updated_at: new Date() },
    });
  }

  async softDelete(id: string, tenantId: string, userId: string) {
    return this.model.updateMany({
      where: { def_id: id, tenant_id: tenantId, is_deleted: 0 },
      data: {
        is_deleted: 1,
        updated_at: new Date(),
        updated_by: userId,
      },
    });
  }

  /* ============================================================
   * 版本管理
   * ============================================================ */
  async getNextVersion(defKey: string, tenantId: string): Promise<number> {
    const latest = await this.model.findFirst({
      where: { tenant_id: tenantId, def_key: defKey },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }

  /** 停用同 key 的其它已发布版本 */
  async deactivateOtherVersions(
    defKey: string,
    tenantId: string,
    excludeVersion: number,
  ) {
    return this.model.updateMany({
      where: {
        tenant_id: tenantId,
        def_key: defKey,
        version: { lt: excludeVersion },
        status: "1",
        is_deleted: 0,
      },
      data: { status: "2" },
    });
  }

  /* ============================================================
   * 检查
   * ============================================================ */
  /** 是否存在运行中的实例 */
  async countActiveInstances(defId: string, tenantId: string): Promise<number> {
    return prisma.wf_instance.count({
      where: {
        def_id: defId,
        tenant_id: tenantId,
        status: { in: ["0", "3"] },
        is_deleted: 0,
      },
    });
  }

  /** 是否已存在同 key 的版本 */
  async existsByKeyVersion(
    defKey: string,
    version: number,
    tenantId: string,
  ): Promise<boolean> {
    const count = await this.model.count({
      where: {
        tenant_id: tenantId,
        def_key: defKey,
        version,
        is_deleted: 0,
      },
    });
    return count > 0;
  }
}
