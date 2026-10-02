import { BaseRepository } from "@/core/base/repository.js";
import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import type { ArchivePolicyEntity, ArchiveLogEntity } from "./types.js";
import { ArchiveLogListDTO } from "./schema.js";

export class ArchivePolicyRepository extends BaseRepository<
  ArchivePolicyEntity,
  any,
  any,
  any
> {
  protected readonly model = prisma.sys_archive_policy;
  protected readonly primaryKey = "policy_id";

  /* ============================================================
   * 策略查询
   * ============================================================ */
  async findAllEnabled(): Promise<ArchivePolicyEntity[]> {
    return this.model.findMany({
      where: { enabled: 1, is_deleted: 0 },
      orderBy: { table_name: "asc" },
    }) as Promise<ArchivePolicyEntity[]>;
  }

  async findByTableName(
    tableName: string,
  ): Promise<ArchivePolicyEntity | null> {
    return this.model.findFirst({
      where: { table_name: tableName, is_deleted: 0 },
    }) as Promise<ArchivePolicyEntity | null>;
  }

  async findByPolicyId(policyId: string): Promise<ArchivePolicyEntity | null> {
    return this.model.findFirst({
      where: { policy_id: policyId, is_deleted: 0 },
    }) as Promise<ArchivePolicyEntity | null>;
  }

  /* ============================================================
   * 策略更新
   * ============================================================ */
  async updatePolicy(
    policyId: string,
    data: Record<string, unknown>,
    operatorId?: string,
  ): Promise<void> {
    const affected = await this.model.updateMany({
      where: { policy_id: policyId, is_deleted: 0 },
      data: {
        ...data,
        updated_by: operatorId ?? null,
        updated_at: new Date(),
      },
    });
    if (affected.count === 0) {
      throw new AppError("归档策略不存在", 404001, 404);
    }
  }

  /** 更新执行状态（执行后回写） */
  async updateLastRun(
    policyId: string,
    status: string,
    errorMsg: string | null,
  ): Promise<void> {
    await this.model.updateMany({
      where: { policy_id: policyId },
      data: {
        last_run_at: new Date(),
        last_status: status,
        last_error: errorMsg,
      },
    });
  }

  /* ============================================================
   * 归档执行日志
   * ============================================================ */
  async insertLog(data: {
    policyId: string | null;
    tableName: string;
    partitionName: string | null;
    archiveMode: string;
    retentionStart: Date | null;
    retentionEnd: Date | null;
    rowCount: bigint;
    archivedSize: bigint;
    archiveUrl: string | null;
    status: string;
    errorMsg: string | null;
    durationMs: number;
    startedAt: Date;
    finishedAt: Date;
    createdBy?: string;
  }): Promise<void> {
    await prisma.sys_archive_log.create({
      data: {
        policy_id: data.policyId,
        table_name: data.tableName,
        partition_name: data.partitionName,
        archive_mode: data.archiveMode,
        retention_start: data.retentionStart,
        retention_end: data.retentionEnd,
        row_count: data.rowCount,
        archived_size: data.archivedSize,
        archive_url: data.archiveUrl,
        status: data.status,
        error_msg: data.errorMsg,
        duration_ms: data.durationMs,
        started_at: data.startedAt,
        finished_at: data.finishedAt,
        created_by: data.createdBy ?? null,
      },
    });
  }

  async findLogPage(query: ArchiveLogListDTO): Promise<{
    list: ArchiveLogEntity[];
    total: number;
    pageNum: number;
    pageSize: number;
    totalPages: number;
  }> {
    const pageNum = Math.max(1, query.pageNum || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (pageNum - 1) * pageSize;

    const where: any = {};
    if (query.tableName) where.table_name = query.tableName;
    if (query.status) where.status = query.status;
    if (query.startTime || query.endTime) {
      where.started_at = {};
      if (query.startTime) where.started_at.gte = query.startTime;
      if (query.endTime) where.started_at.lte = query.endTime;
    }

    const [list, total] = await Promise.all([
      prisma.sys_archive_log.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { started_at: "desc" },
      }),
      prisma.sys_archive_log.count({ where }),
    ]);

    return {
      list: list as unknown as ArchiveLogEntity[],
      total,
      pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async cleanExpiredLogs(before: Date): Promise<number> {
    const r = await prisma.sys_archive_log.deleteMany({
      where: { started_at: { lt: before } },
    });
    return r.count;
  }

  /* ============================================================
   * 分区信息查询（供执行器使用）
   * ============================================================ */
  async listPartitions(parentTable: string): Promise<string[]> {
    const rows = await prisma.$queryRaw<Array<{ relname: string }>>`
      SELECT c.relname
        FROM pg_class c
        JOIN pg_inherits i ON i.inhrelid = c.oid
        JOIN pg_class p ON p.oid = i.inhparent
       WHERE p.relname = ${parentTable}
       ORDER BY c.relname ASC
    `;
    return rows.map((r) => r.relname);
  }

  async partitionRowCount(partitionName: string): Promise<bigint> {
    const rows = await prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
      `SELECT COUNT(*)::bigint AS cnt FROM "${partitionName}"`,
    );
    return rows[0]?.cnt ?? 0n;
  }

  async partitionSize(partitionName: string): Promise<bigint> {
    const rows = await prisma.$queryRawUnsafe<Array<{ size: bigint | null }>>(
      `SELECT pg_total_relation_size('"${partitionName}"'::regclass) AS size`,
    );
    return rows[0]?.size ?? 0n;
  }

  async dropPartition(partitionName: string): Promise<void> {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${partitionName}"`);
  }

  /** 普通表：按时间范围删除 */
  async deleteByTimeRange(
    tableName: string,
    timeColumn: string,
    cutoff: Date,
    limit: number,
  ): Promise<number> {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "${tableName}"
        WHERE ${timeColumn} < $1
        AND ctid IN (
          SELECT ctid FROM "${tableName}"
           WHERE ${timeColumn} < $1
           LIMIT ${limit}
        )`,
      cutoff,
    );
    return Number(result);
  }

  async countByTimeRange(
    tableName: string,
    timeColumn: string,
    cutoff: Date,
  ): Promise<bigint> {
    const rows = await prisma.$queryRawUnsafe<Array<{ cnt: bigint }>>(
      `SELECT COUNT(*)::bigint AS cnt FROM "${tableName}" WHERE ${timeColumn} < $1`,
      cutoff,
    );
    return rows[0]?.cnt ?? 0n;
  }
}
