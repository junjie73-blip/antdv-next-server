import { LRUCache } from "lru-cache";

export function createLru<K extends string, V extends {}>(opts: {
  max: number;
  ttlMs: number;
  name: string;
}) {
  return new LRUCache<K, V>({
    max: opts.max,
    ttl: opts.ttlMs,
    updateAgeOnGet: false,
    allowStale: false,
  });
}
