import { AppError } from "@/core/errors.js";
import { SlowQueryRepository } from "../repository.js";
import { fingerprintOf, extractFilterColumns } from "../normalizer.js";
import type { SlowQueryListQuery, SlowQueryRow } from "../types.js";
import { SLOW_QUERY_STATUS } from "../constants.js";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";

interface IndexSuggestion {
  table: string;
  columns: string[];
  reason: string;
  existingIndexes: string[];
}

export class SlowQueryService {
  private repo = new SlowQueryRepository();

  /* ============================================================
   * 列表
   * ============================================================ */
  async list(query: SlowQueryListQuery) {
    return this.repo.findPage(query);
  }

  /* ============================================================
   * 详情（含索引建议）
   * ============================================================ */
  async detail(id: string) {
    const row = await this.repo.findById(id);
    if (!row) throw new AppError("慢查询记录不存在", 404001, 404);
    const _row = keysToCamelCase(row) as any;
    const suggestion = await this.buildIndexSuggestion(row);
    return { ..._row, indexSuggestion: suggestion };
  }

  /* ============================================================
   * 标记 resolved / ignored
   * ============================================================ */
  async review(
    id: string,
    status: string,
    note: string | undefined,
    reviewerId: string,
  ) {
    const row = await this.repo.findById(id);
    if (!row) throw new AppError("慢查询记录不存在", 404001, 404);

    if (
      status !== SLOW_QUERY_STATUS.RESOLVED &&
      status !== SLOW_QUERY_STATUS.IGNORED
    ) {
      throw new AppError("无效的 review 状态", 400001, 400);
    }

    const affected = await this.repo.review(
      id,
      status,
      note ?? null,
      reviewerId,
    );
    return { updated: affected };
  }

  /* ============================================================
   * 索引建议（best-effort）
   * ============================================================ */
  private async buildIndexSuggestion(
    row: SlowQueryRow,
  ): Promise<IndexSuggestion | null> {
    const normalized = row.query_sample.toLowerCase();

    // 1. 提取主表
    const tableMatch = normalized.match(/\bfrom\s+"?([a-z_][a-z0-9_]*)"?/i);
    if (!tableMatch) return null;
    const table = tableMatch[1];

    // 2. 提取过滤字段
    const { normalized: normalizedSql } = fingerprintOf(row.query_sample, null);
    const cols = extractFilterColumns(normalizedSql);
    if (cols.length === 0) return null;

    // 3. 查已有索引
    let existingIndexes: string[] = [];
    try {
      existingIndexes = await this.repo.listTableIndexes(table);
    } catch {
      return null;
    }

    // 4. 判断：若某字段在所有索引定义里都没出现 → 建议加索引
    const missing = cols.filter((c) => {
      const re = new RegExp(`\\b${c}\\b`, "i");
      return !existingIndexes.some((idx) => re.test(idx));
    });

    if (missing.length === 0) return null;

    return {
      table,
      columns: missing,
      reason: `SQL 使用 ${missing.join(", ")} 作为过滤/排序条件，但现有索引未覆盖`,
      existingIndexes,
    };
  }

  /* ============================================================
   * 统计概览（供面板）
   * ============================================================ */
  async stats() {
    const page = await this.repo.findPage({ pageNum: 1, pageSize: 1 });
    const open = await this.repo.findPage({
      pageNum: 1,
      pageSize: 1,
      status: SLOW_QUERY_STATUS.OPEN,
    });
    return {
      total: page.total,
      open: open.total,
    };
  }
}

export const slowQueryService = new SlowQueryService();
