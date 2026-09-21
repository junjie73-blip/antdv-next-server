import pLimit from "p-limit";
import { logger } from "@/platform/logger/index.js";

export async function mapPool<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  opts: { concurrency?: number; failFast?: boolean; label?: string } = {},
): Promise<Array<R | Error>> {
  const { concurrency = 10, failFast = false, label = "mapPool" } = opts;
  const limit = pLimit(concurrency);
  const started = Date.now();

  const results = await Promise.all(
    items.map((item, i) =>
      limit(async () => {
        try {
          return await fn(item, i);
        } catch (err) {
          if (failFast) throw err;
          logger.warn({ err, label, index: i }, "mapPool item failed");
          return err as Error;
        }
      }),
    ),
  );

  logger.debug(
    { label, count: items.length, concurrency, ms: Date.now() - started },
    "mapPool done",
  );
  return results;
}

export const heavyPool = pLimit(4);
