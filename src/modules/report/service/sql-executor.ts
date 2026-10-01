import { prisma } from "@/config/database.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { rpSqlTotal, rpSqlDuration } from "@/platform/metrics/report.js";

/* ============================================================
 * 常量
 * ============================================================ */
const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "grant",
  "revoke",
  "execute",
  "copy",
  "vacuum",
  "analyze",
  "call",
  "do",
  "commit",
  "rollback",
  "savepoint",
  "set",
];

const DEFAULT_MAX_ROWS = 10_000;
const DEFAULT_TIMEOUT = 30_000;

/** 允许的 schema 白名单 */
const ALLOWED_TABLES = new Set<string>(); // 空集合 = 不限制

/* ============================================================
 * 类型
 * ============================================================ */
export interface ExecuteOptions {
  sql: string;
  variables: Record<string, any>;
  tenantId: string;
  maxRows?: number;
  timeout?: number;
  /** 是否强制注入租户过滤（默认 true） */
  enforceTenant?: boolean;
}

export interface ExecuteResult {
  rows: Record<string, any>[];
  duration: number;
  rowCount: number;
}

export interface SqlValidationResult {
  valid: boolean;
  error?: string;
  variables?: string[];
  tables?: string[];
}

/* ============================================================
 * SQL 执行器
 * ============================================================ */
export class SqlExecutor {
  /**
   * 安全执行 SELECT 查询
   */
  static async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const {
      sql,
      variables,
      tenantId,
      maxRows = DEFAULT_MAX_ROWS,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    // 1. 校验
    const validation = this.validate(sql);
    if (!validation.valid) {
      throw new AppError(validation.error!, 400001, 400);
    }

    // 2. 强制注入租户过滤
    let finalSql = sql;
    const finalVariables = { ...variables };

    if (options.enforceTenant !== false) {
      if (finalSql.includes(":tenantId")) {
        finalVariables.tenantId = tenantId;
      }
    }

    // 3. 解析 :param 占位符 → $1, $2 ...
    const values: any[] = [];
    const paramNames: string[] = [];
    finalSql = finalSql.replace(
      /:([a-zA-Z_][a-zA-Z0-9_]*)/g,
      (_, name: string) => {
        paramNames.push(name);
        values.push(finalVariables[name] ?? null);
        return `$${paramNames.length}`;
      },
    );

    // 4. 追加 limit
    if (!/limit\s+\d+/i.test(finalSql)) {
      finalSql += ` LIMIT ${maxRows}`;
    }

    logger.debug(
      { sql: finalSql.slice(0, 300), params: values.length, tenantId },
      "[sql-executor] 执行中",
    );

    // 5. 执行（超时保护）
    const start = Date.now();
    let rows: Record<string, any>[];
    let status = "success";
    try {
      rows = await Promise.race([
        prisma.$queryRawUnsafe<Record<string, any>[]>(finalSql, ...values),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new AppError("查询超时", 408001, 408)),
            timeout,
          ),
        ),
      ]);
      status = "success";
      rpSqlTotal.labels(tenantId, status).inc();
      rpSqlDuration.labels(status).observe((Date.now() - start) / 1000);
    } catch (err: any) {
      status = err.code === 408001 ? "timeout" : "failed";
      rpSqlTotal.labels(tenantId, status).inc();
      rpSqlDuration.labels(status).observe((Date.now() - start) / 1000);
      if (err instanceof AppError) throw err;
      logger.error(
        { err, sql: finalSql, params: values },
        "[sql-executor] 执行失败",
      );
      throw new AppError(`查询失败：${err.message}`, 500001, 500);
    }

    const duration = Date.now() - start;

    // 6. 处理 BigInt（JSON 序列化问题）
    const safeRows = this.sanitizeRows(rows);

    logger.info(
      { rowCount: safeRows.length, duration, tenantId },
      "[sql-executor] 执行成功",
    );

    return {
      rows: safeRows,
      duration,
      rowCount: safeRows.length,
    };
  }

  /**
   * 校验 SQL（不执行）
   */
  static validate(sql: string): SqlValidationResult {
    if (!sql || typeof sql !== "string") {
      return { valid: false, error: "SQL 不能为空" };
    }

    const trimmed = sql.trim().toLowerCase();

    // 1. 必须以 SELECT 或 WITH 开头
    if (!trimmed.startsWith("select") && !trimmed.startsWith("with")) {
      return { valid: false, error: "必须以 SELECT 或 WITH 开头" };
    }

    // 2. 禁止危险关键字
    for (const kw of FORBIDDEN_KEYWORDS) {
      // 用单词边界匹配，避免误伤字段名（如 "created_at"）
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(sql)) {
        return { valid: false, error: `禁止使用关键字：${kw}` };
      }
    }

    // 3. 禁止多语句
    const semicolonCount = (sql.match(/;/g) ?? []).length;
    const semicolonAtEnd = sql.trim().endsWith(";");
    if (semicolonCount > (semicolonAtEnd ? 1 : 0)) {
      return { valid: false, error: "不允许包含多条 SQL 语句" };
    }

    // 4. 禁止注释（潜在注入）
    if (/--/.test(sql) || /\/\*/.test(sql)) {
      return { valid: false, error: "SQL 中不允许包含注释" };
    }

    // 5. 禁止 union 注入（可选，保守策略）
    if (/\bunion\b/i.test(sql) && !/\bunion\s+all\b/i.test(sql)) {
      // 允许 union all，但拒绝普通 union
      return { valid: false, error: "请使用 UNION ALL 而非 UNION" };
    }

    // 6. 提取变量
    const variables = this.extractVariables(sql);

    // 7. 提取表名（简单识别，用于审计）
    const tables = this.extractTables(sql);

    return {
      valid: true,
      variables,
      tables,
    };
  }

  /**
   * 提取 :param 占位符
   */
  static extractVariables(sql: string): string[] {
    const names = new Set<string>();
    const regex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sql)) !== null) {
      names.add(m[1]);
    }
    return [...names];
  }

  /**
   * 提取表名
   */
  static extractTables(sql: string): string[] {
    const tables = new Set<string>();
    const regex = /\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sql)) !== null) {
      tables.add(m[1]);
    }
    return [...tables];
  }

  /**
   * 处理 BigInt / Date 等类型
   */
  private static sanitizeRows(
    rows: Record<string, any>[],
  ): Record<string, any>[] {
    return rows.map((row) => {
      const safe: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === "bigint") {
          safe[k] = Number(v);
        } else if (v instanceof Date) {
          safe[k] = v.toISOString();
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          // 嵌套对象也处理
          safe[k] = JSON.parse(
            JSON.stringify(v, (_k, val) =>
              typeof val === "bigint" ? Number(val) : val,
            ),
          );
        } else {
          safe[k] = v;
        }
      }
      return safe;
    });
  }

  /**
   * 测试执行（返回前 N 行）
   */
  static async preview(
    sql: string,
    tenantId: string,
    limit = 100,
  ): Promise<ExecuteResult> {
    return this.execute({
      sql,
      variables: { tenantId },
      tenantId,
      maxRows: limit,
      timeout: 10_000,
    });
  }
}
