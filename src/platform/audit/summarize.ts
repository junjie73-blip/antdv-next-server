import { createHash } from "node:crypto";
import { deepRedact } from "@/core/security/redact.js";

const MAX_BODY_BYTES = 4 * 1024;
const SKIP_BODY_CONTENT_TYPES = [
  "multipart/form-data",
  "application/octet-stream",
];

export interface AuditPayload {
  query: unknown;
  body: unknown;
  contentType: string;
}

export function summarizeRequest(p: AuditPayload): Record<string, unknown> {
  if (SKIP_BODY_CONTENT_TYPES.some((t) => p.contentType.includes(t))) {
    return { query: deepRedact(p.query), body: "[BINARY_SKIPPED]" };
  }

  const redacted = deepRedact(p.body) as Record<string, unknown>;
  const serialized = JSON.stringify(redacted);

  if (serialized.length <= MAX_BODY_BYTES) {
    return { query: deepRedact(p.query), body: redacted };
  }

  return {
    query: deepRedact(p.query),
    body: {
      _truncated: true,
      _len: serialized.length,
      _sha256: createHash("sha256")
        .update(serialized)
        .digest("hex")
        .slice(0, 16),
      _keys: Object.keys(redacted).slice(0, 20),
    },
  };
}

export function summarizeResponse(body: any): Record<string, unknown> | null {
  if (!body || typeof body !== "object") return null;
  return {
    code: body.code ?? null,
    msg: typeof body.msg === "string" ? body.msg.slice(0, 200) : null,
  };
}
