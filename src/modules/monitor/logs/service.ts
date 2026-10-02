import { AppError } from "@/core/errors.js";
import { queryLoki } from "@/platform/logging/query-client.js";
import { env } from "@/config/env.js";
import type { LogQueryDTO, QuickSearchDTO } from "@/platform/logging/schema.js";
import { LOKI_ALLOWED_LABELS } from "@/platform/logging/constants.js";

export interface LogEntry {
  timestamp: number;
  message: string;
  labels: Record<string, string>;
}

export class LogService {
  isEnabled(): boolean {
    return !!env.LOKI_URL;
  }

  /** 结构化查询（LogQL 直传，但做安全校验） */
  async query(dto: LogQueryDTO): Promise<{ logs: LogEntry[]; total: number }> {
    this.assertEnabled();
    this.assertQuerySafe(dto.query);

    const result = await queryLoki({
      query: dto.query,
      start: dto.start * 1_000_000, // ms → ns
      end: dto.end * 1_000_000,
      limit: dto.limit,
      direction: dto.direction,
    });

    return {
      logs: flatten(result.streams),
      total: result.stats.total,
    };
  }

  /** 快捷检索：用白名单 label 拼 LogQL */
  async quickSearch(dto: QuickSearchDTO): Promise<{
    logs: LogEntry[];
    total: number;
    lokiQuery: string;
  }> {
    this.assertEnabled();

    const end = Date.now();
    const start = end - dto.sinceMinutes * 60_000;

    // 组装 label filters
    const labelFilters: string[] = [];
    labelFilters.push(`service="${env.OTEL_SERVICE_NAME ?? "api"}"`);
    if (dto.level) labelFilters.push(`level="${dto.level}"`);
    if (dto.module) labelFilters.push(`module="${dto.module}"`);
    if (dto.tenantId) labelFilters.push(`tenant_id="${dto.tenantId}"`);

    let lokiQuery = `{${labelFilters.join(",")}}`;
    if (dto.keyword) {
      lokiQuery += ` |= ${JSON.stringify(dto.keyword)}`;
    }

    const result = await queryLoki({
      query: lokiQuery,
      start: start * 1_000_000,
      end: end * 1_000_000,
      limit: dto.limit,
      direction: "backward",
    });

    return {
      logs: flatten(result.streams),
      total: result.stats.total,
      lokiQuery,
    };
  }

  /** 按 traceId 查（高频场景） */
  async byTraceId(traceId: string, limit = 500) {
    this.assertEnabled();
    if (!/^[a-f0-9]{16,64}$/i.test(traceId)) {
      throw new AppError("无效的 traceId", 400001, 400);
    }

    const end = Date.now();
    const start = end - 24 * 3600 * 1000;

    const result = await queryLoki({
      query: `{service="${env.OTEL_SERVICE_NAME ?? "api"}"} |= "${traceId}"`,
      start: start * 1_000_000,
      end: end * 1_000_000,
      limit,
      direction: "forward",
    });

    return { logs: flatten(result.streams), total: result.stats.total };
  }

  /* ============================================================
   * 内部
   * ============================================================ */
  private assertEnabled(): void {
    if (!env.LOKI_URL) {
      throw new AppError("日志聚合未启用", 501001, 501);
    }
  }

  /** 校验 LogQL 只包含白名单 label（防注入 / 误查） */
  private assertQuerySafe(query: string): void {
    // 简单校验：提取 {label=...} 里的 label 名
    const m = query.match(/\{([^}]+)\}/);
    if (!m) return;
    const labels = m[1]
      .split(",")
      .map((p) => p.split(/=|\!=|=~|!~/)[0].trim())
      .filter(Boolean);
    for (const l of labels) {
      if (!(LOKI_ALLOWED_LABELS as readonly string[]).includes(l)) {
        throw new AppError(`不允许的 label: ${l}`, 400001, 400);
      }
    }
  }
}

function flatten(
  streams: Array<{
    stream: Record<string, string>;
    values: Array<[string, string]>;
  }>,
): LogEntry[] {
  const out: LogEntry[] = [];
  for (const s of streams) {
    for (const [ts, line] of s.values) {
      out.push({
        timestamp: Math.floor(Number(ts) / 1_000_000),
        message: line,
        labels: s.stream,
      });
    }
  }
  return out.sort((a, b) => b.timestamp - a.timestamp);
}

export const logService = new LogService();
