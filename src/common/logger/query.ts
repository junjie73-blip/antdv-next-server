import { createReadStream } from "fs";
import { createInterface } from "readline";
import { join } from "path";

export interface LogEntry {
  time: string;
  level: number;
  msg: string;
  [key: string]: any;
}

export async function queryLogs(options: {
  level?: string;
  type?: string; // audit, access, error
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}): Promise<LogEntry[]> {
  const { level, type, startTime, endTime, limit = 100, offset = 0 } = options;
  const results: LogEntry[] = [];
  let skipped = 0;

  const stream = createReadStream(join(process.cwd(), "logs/app.log"), {
    encoding: "utf8",
  });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    try {
      const entry: LogEntry = JSON.parse(line);
      if (level && entry.level !== pinoLevelToNumber(level)) continue;
      if (type && entry.type !== type) continue;
      if (startTime && entry.time < startTime) continue;
      if (endTime && entry.time > endTime) continue;

      if (skipped < offset) {
        skipped++;
        continue;
      }
      results.push(entry);
      if (results.length >= limit) break;
    } catch {
      // 忽略解析失败的行
    }
  }

  return results;
}

function pinoLevelToNumber(level: string): number {
  const map: Record<string, number> = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60,
  };
  return map[level] || 30;
}
