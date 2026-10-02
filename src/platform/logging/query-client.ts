import { env } from "@/config/env.js";
import { logger } from "@/platform/logger/index.js";

interface LokiQueryParams {
  query: string; // LogQL
  start: number; // 纳秒时间戳
  end: number;
  limit: number;
  direction: "forward" | "backward";
}

interface LokiLogLine {
  ts: string;
  line: string;
}

interface LokiStream {
  stream: Record<string, string>;
  values: Array<[string, string]>; // [ts_ns, line]
}

export async function queryLoki(params: LokiQueryParams): Promise<{
  streams: LokiStream[];
  stats: { total: number };
}> {
  if (!env.LOKI_URL) {
    return { streams: [], stats: { total: 0 } };
  }

  const url = new URL("/loki/api/v1/query_range", env.LOKI_URL);
  url.searchParams.set("query", params.query);
  url.searchParams.set("start", String(params.start));
  url.searchParams.set("end", String(params.end));
  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("direction", params.direction);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "[loki] query failed");
      return { streams: [], stats: { total: 0 } };
    }
    const data = (await res.json()) as {
      data: { result: LokiStream[]; stats: any };
    };
    return {
      streams: data.data?.result ?? [],
      stats: { total: data.data?.stats?.summary?.totalLines ?? 0 },
    };
  } catch (err) {
    logger.warn({ err }, "[loki] query error");
    return { streams: [], stats: { total: 0 } };
  }
}
