import { isSensitive } from "./sensitive-keys.js";

const MAX_STR = 4 * 1024;
const MAX_ARR = 100;
const MAX_DEPTH = 6;

export function deepRedact(input: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[TRUNCATED]";
  if (input == null) return input;
  if (typeof input === "string") {
    return input.length > MAX_STR ? input.slice(0, MAX_STR) + "…" : input;
  }
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) {
    return input.slice(0, MAX_ARR).map((v) => deepRedact(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (isSensitive(k)) out[k] = "[REDACTED]";
    else out[k] = deepRedact(v, depth + 1);
  }
  return out;
}
