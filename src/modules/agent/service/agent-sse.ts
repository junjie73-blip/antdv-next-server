import { logger } from "@/platform/logger/index.js";
import { SSE_MAX_FRAME_BYTES } from "../constants.js";

export interface RawSseFrame {
  event: string;
  data: string;
}

/**
 * 增量 SSE 解析器：网络 chunk 不保证按帧边界切分，内部保留不完整尾部。
 * 规则遵循 SSE 规范：`:` 开头为注释（心跳），`data:` 可多行（用 \n 拼接）。
 */
export function createSseParser(): {
  push(chunk: Uint8Array | string): RawSseFrame[];
  flush(): RawSseFrame[];
} {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  const parseBlock = (block: string): RawSseFrame | null => {
    if (!block) return null;
    let event = "message";
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (!line || line.startsWith(":")) continue;
      const idx = line.indexOf(":");
      const field = idx === -1 ? line : line.slice(0, idx);
      // SSE 规范：冒号后若有一个空格需去掉
      const raw = idx === -1 ? "" : line.slice(idx + 1);
      const value = raw.startsWith(" ") ? raw.slice(1) : raw;
      if (field === "event") event = value;
      else if (field === "data") dataLines.push(value);
    }

    if (dataLines.length === 0) return null;
    const data = dataLines.join("\n");
    if (data.length > SSE_MAX_FRAME_BYTES) {
      logger.warn({ event, bytes: data.length }, "[agent-sse] 单帧超长已丢弃");
      return null;
    }
    return { event, data };
  };

  const drain = (text: string): RawSseFrame[] => {
    if (!text) return [];
    buffer += text;
    // 统一换行；末尾孤立的 \r 会保留到下一 chunk 再归一化
    buffer = buffer.replace(/\r\n/g, "\n");
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    const frames: RawSseFrame[] = [];
    for (const part of parts) {
      const frame = parseBlock(part);
      if (frame) frames.push(frame);
    }
    return frames;
  };

  return {
    push(chunk) {
      const text =
        typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
      return drain(text);
    },
    flush() {
      const tail = decoder.decode();
      const frames = drain(tail);
      const last = parseBlock(buffer);
      buffer = "";
      if (last) frames.push(last);
      return frames;
    },
  };
}
