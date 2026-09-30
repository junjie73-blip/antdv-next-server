import { prisma } from "@/config/database.js";

export interface DbInfo {
  version: string;
  database: string;
  size: string;
  sizeBytes: number;
  connections: {
    total: number;
    active: number;
    idle: number;
    max: number;
  };
  uptime: string;
  startTime: Date;
}

export interface SlowQuery {
  query: string;
  calls: number;
  meanTime: number;
  totalTime: number;
  rows: number;
}

export interface TableStat {
  schema: string;
  name: string;
  liveRows: number;
  deadRows: number;
  totalSize: string;
  totalSizeBytes: number;
  indexSize: string;
  seqScan: number;
  idxScan: number;
}

export interface IndexStat {
  schema: string;
  table: string;
  index: string;
  idxScan: number;
  size: string;
}

export class DatabaseMonitorService {
  /**
   * 数据库基础信息
   */
  async getInfo(): Promise<DbInfo> {
    const [version, db] = await Promise.all([
      prisma.$queryRaw<any[]>`SELECT version() AS v`,
      prisma.$queryRaw<any[]>`
        SELECT current_database() AS db_name,
               pg_database_size(current_database()) AS size
      `,
    ]);

    const dbName = db[0].db_name;
    const sizeBytes = Number(db[0].size);

    const [conn, setting] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE state = 'active')::int AS active,
          COUNT(*) FILTER (WHERE state = 'idle')::int AS idle
        FROM pg_stat_activity
        WHERE datname = current_database()
      `,
      prisma.$queryRaw<any[]>`
        SELECT setting::int AS max_conn FROM pg_settings WHERE name = 'max_connections'
      `,
    ]);

    const stat = await prisma.$queryRaw<any[]>`
      SELECT pg_postmaster_start_time() AS start_time
    `;

    return {
      version: version[0].v.split(",")[0],
      database: dbName,
      size: this.formatBytes(sizeBytes),
      sizeBytes,
      connections: {
        total: conn[0].total,
        active: conn[0].active,
        idle: conn[0].idle,
        max: setting[0]?.max_conn ?? 100,
      },
      uptime: this.formatUptime(new Date(stat[0].start_time)),
      startTime: stat[0].start_time,
    };
  }

  /**
   * 慢查询（需要 pg_stat_statements 扩展）
   */
  async getSlowQueries(limit = 20): Promise<SlowQuery[]> {
    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT
          query,
          calls,
          mean_exec_time AS mean_time,
          total_exec_time AS total_time,
          rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
          AND query NOT LIKE 'SELECT 1%'
        ORDER BY mean_exec_time DESC
        LIMIT ${limit}
      `;
      return rows.map((r) => ({
        query: r.query.slice(0, 500),
        calls: Number(r.calls),
        meanTime: Number(Number(r.mean_time).toFixed(2)),
        totalTime: Number(Number(r.total_time).toFixed(2)),
        rows: Number(r.rows),
      }));
    } catch {
      // pg_stat_statements 未开启
      return [];
    }
  }

  /**
   * 表统计
   */
  async getTableStats(limit = 30): Promise<TableStat[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname AS schema,
        relname AS name,
        n_live_tup AS live_rows,
        n_dead_tup AS dead_rows,
        pg_total_relation_size(relid) AS total_size,
        pg_relation_size(relid) AS table_size,
        pg_indexes_size(relid) AS index_size,
        seq_scan,
        idx_scan
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      schema: r.schema,
      name: r.name,
      liveRows: Number(r.live_rows),
      deadRows: Number(r.dead_rows),
      totalSize: this.formatBytes(Number(r.total_size)),
      totalSizeBytes: Number(r.total_size),
      indexSize: this.formatBytes(Number(r.index_size)),
      seqScan: Number(r.seq_scan),
      idxScan: Number(r.idx_scan),
    }));
  }

  /**
   * 索引统计（Top N 最常用）
   */
  async getIndexStats(limit = 20): Promise<IndexStat[]> {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname AS schema,
        relname AS table,
        indexrelname AS index,
        idx_scan,
        pg_relation_size(indexrelid) AS size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      schema: r.schema,
      table: r.table,
      index: r.index,
      idxScan: Number(r.idx_scan),
      size: this.formatBytes(Number(r.size)),
    }));
  }

  /**
   * 表膨胀检测（dead rows 比例 > 20%）
   */
  async getBloatTables() {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname AS schema,
        relname AS name,
        n_live_tup AS live_rows,
        n_dead_tup AS dead_rows,
        ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS bloat_pct
      FROM pg_stat_user_tables
      WHERE n_dead_tup > 1000
        AND n_dead_tup > n_live_tup * 0.2
      ORDER BY n_dead_tup DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      schema: r.schema,
      name: r.name,
      liveRows: Number(r.live_rows),
      deadRows: Number(r.dead_rows),
      bloatPct: Number(r.bloat_pct ?? 0),
    }));
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  private formatUptime(startTime: Date): string {
    const ms = Date.now() - startTime.getTime();
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (days > 0) return `${days}天 ${hours}小时`;
    if (hours > 0) return `${hours}小时 ${mins}分钟`;
    return `${mins}分钟`;
  }
}
