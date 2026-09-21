import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { NotFoundError } from "@/core/errors.js";
import type { BaseQuery, PageResult } from "@/types/base-repository.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { logger } from "@/platform/logger/logger.js";

interface GenTableRow {
  table_id: string;
  table_name: string;
  table_comment: string | null;
  class_name: string;
  table_status: string;
  tenant_id: string;
  is_deleted: number;
  created_at: Date;
  updated_at: Date;
  [key: string]: unknown;
}

interface GenTableColumnRow {
  column_id: string;
  table_id: string;
  column_name: string;
  [key: string]: unknown;
}

export interface GenTableWithColumns extends GenTableRow {
  columns: GenTableColumnRow[];
}

export class GenTableRepository extends BaseRepository<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
  GenTableRow
> {
  protected readonly model = prisma.gen_table;
  protected readonly primaryKey = "table_id";

  /** 覆写原因：需叠加关键字模糊查询 */
  async findPage(
    query: BaseQuery & { keyword?: string },
    where: Record<string, unknown>,
  ): Promise<PageResult<GenTableRow>> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 10));
    const skip = (pageNum - 1) * pageSize;

    const finalWhere: Record<string, unknown> = {
      ...where,
      tenant_id: query.tenantId,
      is_deleted: 0,
    };

    if (query.keyword) {
      finalWhere.OR = [
        { table_name: { contains: query.keyword } },
        { table_comment: { contains: query.keyword } },
      ];
    }

    const scopedWhere = this.mergeDataScope(finalWhere);

    const [list, total] = await Promise.all([
      this.model.findMany({
        where: scopedWhere,
        skip,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.model.count({ where: scopedWhere }),
    ]);

    return {
      list: list as GenTableRow[],
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findWithColumns(
    tableId: string,
    tenantId: string,
  ): Promise<GenTableWithColumns> {
    const table = await this.model.findFirst({
      where: { table_id: tableId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!table) throw new NotFoundError("生成表不存在");
    const columns = (await prisma.gen_table_column.findMany({
      where: { table_id: tableId },
      orderBy: { sort: "asc" },
    })) as GenTableColumnRow[];
    return {
      ...keysToCamelCase(table),
      columns: columns.map<GenTableColumnRow>(keysToCamelCase),
    };
  }

  async findByTableName(
    tableName: string,
    tenantId: string,
  ): Promise<GenTableRow | null> {
    return this.model.findFirst({
      where: { table_name: tableName, tenant_id: tenantId, is_deleted: 0 },
    }) as unknown as Promise<GenTableRow | null>;
  }

  /** 事务内保存表 + 字段（先删后建，无外键） */
  async saveWithColumns(
    tableData: Record<string, unknown>,
    columns: Array<Record<string, unknown>>,
    tableId?: string,
  ): Promise<string> {
    return prisma.$transaction(async (tx) => {
      let id = tableId;
      if (id) {
        await tx.gen_table.update({
          where: { table_id: id },
          data: tableData as never,
        });
        await tx.gen_table_column.deleteMany({ where: { table_id: id } });
      } else {
        const created = await tx.gen_table.create({ data: tableData as never });
        id = created.table_id;
      }
      if (columns.length > 0) {
        await tx.gen_table_column.createMany({
          data: columns.map((c) => ({ ...c, table_id: id })) as never,
          skipDuplicates: true,
        });
      }
      return id;
    });
  }

  /** 更新状态（建表成功/失败后调用） */
  async updateStatus(tableId: string, status: string): Promise<void> {
    await this.model.update({
      where: { table_id: tableId },
      data: { table_status: status },
    });
  }

  /** 软删除表 + 级联删除字段（无外键） */
  async softDeleteTable(
    tableId: string,
    tenantId: string,
    userId?: string,
  ): Promise<void> {
    const table = await this.model.findFirst({
      where: { table_id: tableId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!table) throw new NotFoundError("生成表不存在");

    await prisma.$transaction([
      this.model.update({
        where: { table_id: tableId },
        data: {
          is_deleted: 1,
          updated_by: userId,
          updated_at: new Date(),
        },
      }),
      prisma.gen_table_column.deleteMany({ where: { table_id: tableId } }),
    ]);
  }
}
