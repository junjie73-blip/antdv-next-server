import { logger } from "@/platform/logger/index.js";
import { getSystemStorage } from "@/platform/storage/system.js";
import { createGzip } from "node:zlib";
import { PassThrough } from "node:stream";
import { prisma } from "@/config/database.js";
import { ArchivePolicyRepository } from "../repository.js";
import {
  ARCHIVE_MODE,
  ARCHIVE_STATUS,
  ALLOWED_TABLES,
  MAX_ARCHIVE_BATCHES,
} from "../constants.js";
import type {
  ArchiveExecutionOptions,
  ArchiveExecutionResult,
} from "../types.js";

const PARTITION_NAME_RE = /^[a-z][a-z0-9_]*_p\d{6}$/;
const IDENT_RE = /^[a-z][a-z0-9_]*$/;
const TIME_COL_RE = /^[a-z][a-z0-9_]*$/;

/**
 * 归档执行器
 * - 支持分区表 / 普通表
 * - 支持 dry-run
 * - 每次执行写 sys_archive_log
 */
export class ArchiveExecutorService {
  private repo = new ArchivePolicyRepository();

  async execute(
    opts: ArchiveExecutionOptions,
  ): Promise<ArchiveExecutionResult> {
    this.assertSafeIdentifiers(opts);

    const startedAt = new Date();
    const cutoff = this.computeCutoff(opts.retentionMonths);

    if (opts.tableType === "partitioned") {
      return this.executePartitioned(opts, cutoff, startedAt);
    }
    return this.executePlain(opts, cutoff, startedAt);
  }

  /* ============================================================
   * 分区表：drop 过期分区
   * ============================================================ */
  private async executePartitioned(
    opts: ArchiveExecutionOptions,
    cutoff: Date,
    startedAt: Date,
  ): Promise<ArchiveExecutionResult> {
    const result: ArchiveExecutionResult = {
      tableName: opts.tableName,
      mode: ARCHIVE_MODE.PARTITION_DROP,
      partitions: [],
      totalRows: 0,
      totalSize: 0,
      durationMs: 0,
      status: ARCHIVE_STATUS.SUCCESS,
    };

    const partitions = await this.repo.listPartitions(opts.tableName);
    if (partitions.length === 0) {
      result.status = ARCHIVE_STATUS.SKIPPED;
      result.durationMs = Date.now() - startedAt.getTime();
      return result;
    }

    for (const name of partitions) {
      const partStart = Date.now();

      // 分区名格式校验
      if (!PARTITION_NAME_RE.test(name)) {
        logger.warn(
          { name, table: opts.tableName },
          "[archive] skip invalid partition name",
        );
        result.partitions.push({
          name,
          rowCount: 0,
          size: 0,
          archiveUrl: null,
          status: ARCHIVE_STATUS.SKIPPED,
          error: "invalid partition name",
        });
        continue;
      }

      const partitionDate = this.parsePartitionDate(name);
      if (!partitionDate || partitionDate >= cutoff) continue;

      // dry-run：只统计
      if (opts.dryRun) {
        const [rows, size] = await Promise.all([
          this.repo.partitionRowCount(name),
          this.repo.partitionSize(name),
        ]);
        result.partitions.push({
          name,
          rowCount: Number(rows),
          size: Number(size),
          archiveUrl: null,
          status: "dry-run",
        });
        result.totalRows += Number(rows);
        result.totalSize += Number(size);
        continue;
      }

      try {
        const [rows, size] = await Promise.all([
          this.repo.partitionRowCount(name),
          this.repo.partitionSize(name),
        ]);

        // 空分区直接 drop
        if (rows === 0n) {
          await this.repo.dropPartition(name);
          await this.writeLog(
            opts,
            name,
            0n,
            0n,
            null,
            ARCHIVE_STATUS.SUCCESS,
            null,
            partStart,
          );
          continue;
        }

        // 上传 S3（可选）
        let archiveUrl: string | null = null;
        if (opts.storageEnabled) {
          archiveUrl = await this.uploadPartition(name, opts.tableName);
        }

        // drop
        await this.repo.dropPartition(name);

        result.partitions.push({
          name,
          rowCount: Number(rows),
          size: Number(size),
          archiveUrl,
          status: ARCHIVE_STATUS.SUCCESS,
        });
        result.totalRows += Number(rows);
        result.totalSize += Number(size);

        await this.writeLog(
          opts,
          name,
          rows,
          size,
          archiveUrl,
          ARCHIVE_STATUS.SUCCESS,
          null,
          partStart,
        );
      } catch (err: any) {
        logger.error(
          { err, partition: name, table: opts.tableName },
          "[archive] partition failed",
        );
        result.status = ARCHIVE_STATUS.FAILED;
        result.partitions.push({
          name,
          rowCount: 0,
          size: 0,
          archiveUrl: null,
          status: ARCHIVE_STATUS.FAILED,
          error: err?.message ?? String(err),
        });

        await this.writeLog(
          opts,
          name,
          0n,
          0n,
          null,
          ARCHIVE_STATUS.FAILED,
          err?.message ?? String(err),
          partStart,
        );
      }
    }

    result.durationMs = Date.now() - startedAt.getTime();
    return result;
  }

  /* ============================================================
   * 普通表：按时间批量删除
   * ============================================================ */
  private async executePlain(
    opts: ArchiveExecutionOptions,
    cutoff: Date,
    startedAt: Date,
  ): Promise<ArchiveExecutionResult> {
    const result: ArchiveExecutionResult = {
      tableName: opts.tableName,
      mode: ARCHIVE_MODE.TIME_RANGE_DELETE,
      partitions: [],
      totalRows: 0,
      totalSize: 0,
      durationMs: 0,
      status: ARCHIVE_STATUS.SUCCESS,
    };

    const total = await this.repo.countByTimeRange(
      opts.tableName,
      opts.timeColumn,
      cutoff,
    );

    if (total === 0n) {
      result.status = ARCHIVE_STATUS.SKIPPED;
      result.durationMs = Date.now() - startedAt.getTime();
      return result;
    }

    if (opts.dryRun) {
      result.totalRows = Number(total);
      result.partitions.push({
        name: "(plain)",
        rowCount: Number(total),
        size: 0,
        archiveUrl: null,
        status: "dry-run",
      });
      result.durationMs = Date.now() - startedAt.getTime();
      return result;
    }

    // 分批删除
    let totalDeleted = 0;
    for (let i = 0; i < MAX_ARCHIVE_BATCHES; i++) {
      const deleted = await this.repo.deleteByTimeRange(
        opts.tableName,
        opts.timeColumn,
        cutoff,
        opts.batchSize,
      );
      totalDeleted += deleted;
      if (deleted < opts.batchSize) break;
    }

    result.totalRows = totalDeleted;
    result.partitions.push({
      name: "(plain)",
      rowCount: totalDeleted,
      size: 0,
      archiveUrl: null,
      status: ARCHIVE_STATUS.SUCCESS,
    });

    await this.writeLog(
      opts,
      null,
      BigInt(totalDeleted),
      0n,
      null,
      ARCHIVE_STATUS.SUCCESS,
      null,
      startedAt.getTime(),
    );

    result.durationMs = Date.now() - startedAt.getTime();
    return result;
  }

  /* ============================================================
   * 上传分区数据到对象存储
   * ============================================================ */
  private async uploadPartition(
    partitionName: string,
    parentTable: string,
  ): Promise<string> {
    // 从分区名提取年月
    const m = /_p(\d{4})(\d{2})$/.exec(partitionName);
    const year = m?.[1] ?? "unknown";
    const key = `archive/${parentTable}/${year}/${partitionName}.ndjson.gz`;

    const gz = createGzip({ level: 6 });
    const pass = new PassThrough();
    gz.pipe(pass);

    const storage = await getSystemStorage();
    const uploadPromise = storage.putObject({
      key,
      body: pass,
      contentType: "application/gzip",
    });

    let lastCreatedAt: Date | null = null;
    let lastId: string | null = null;
    const BATCH = 5000;

    while (true) {
      let rows: Record<string, unknown>[];
      if (lastCreatedAt && lastId) {
        rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM "${partitionName}"
            WHERE (created_at, log_id) > ($1, $2)
            ORDER BY created_at, log_id
            LIMIT ${BATCH}`,
          lastCreatedAt,
          lastId,
        );
      } else {
        rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
          `SELECT * FROM "${partitionName}"
            ORDER BY created_at, log_id
            LIMIT ${BATCH}`,
        );
      }

      if (rows.length === 0) break;

      for (const r of rows) {
        const line = JSON.stringify(r, (_k, v) =>
          typeof v === "bigint" ? v.toString() : v,
        );
        if (!gz.write(line + "\n")) {
          await new Promise((r) => gz.once("drain", r));
        }
      }

      const last = rows[rows.length - 1];
      lastCreatedAt = last.created_at as Date;
      lastId = (last.log_id as string) ?? null;

      if (rows.length < BATCH) break;
    }

    gz.end();
    await uploadPromise;
    return key;
  }

  /* ============================================================
   * 日志写入
   * ============================================================ */
  private async writeLog(
    opts: ArchiveExecutionOptions,
    partitionName: string | null,
    rowCount: bigint,
    size: bigint,
    archiveUrl: string | null,
    status: string,
    errorMsg: string | null,
    startedAt: number,
  ): Promise<void> {
    try {
      await this.repo.insertLog({
        policyId: opts.policyId,
        tableName: opts.tableName,
        partitionName,
        archiveMode:
          opts.tableType === "partitioned"
            ? ARCHIVE_MODE.PARTITION_DROP
            : ARCHIVE_MODE.TIME_RANGE_DELETE,
        retentionStart: null,
        retentionEnd: this.computeCutoff(opts.retentionMonths),
        rowCount,
        archivedSize: size,
        archiveUrl,
        status,
        errorMsg,
        durationMs: Date.now() - startedAt,
        startedAt: new Date(startedAt),
        finishedAt: new Date(),
        createdBy: opts.operatorId,
      });
    } catch (err) {
      logger.error(
        { err, table: opts.tableName },
        "[archive] write log failed",
      );
    }
  }

  /* ============================================================
   * 工具
   * ============================================================ */
  private computeCutoff(retentionMonths: number): Date {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - retentionMonths);
    // 归一到月初
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }

  private parsePartitionDate(partitionName: string): Date | null {
    const m = /_p(\d{4})(\d{2})$/.exec(partitionName);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (y < 2000 || y > 2100 || mo < 1 || mo > 12) return null;
    return new Date(Date.UTC(y, mo - 1, 1));
  }

  private assertSafeIdentifiers(opts: ArchiveExecutionOptions): void {
    if (!ALLOWED_TABLES.has(opts.tableName)) {
      throw new Error(`archive: table not allowed: ${opts.tableName}`);
    }
    if (!IDENT_RE.test(opts.tableName)) {
      throw new Error(`archive: invalid table name: ${opts.tableName}`);
    }
    if (!TIME_COL_RE.test(opts.timeColumn)) {
      throw new Error(`archive: invalid time column: ${opts.timeColumn}`);
    }
  }
}

export const archiveExecutorService = new ArchiveExecutorService();
