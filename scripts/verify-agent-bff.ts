/**
 * Agent BFF 编排验证脚本（开发者工具，非生产代码）。
 *
 * 为什么不引入 vitest/jest：本仓库当前没有测试基建，引入测试框架超出本次任务范围；
 * 该脚本内置"假 Agent SSE 服务器"，无需 LLM、无需 Agent 真身、无需 PG/Redis 即可验证
 * HMAC 签名、跨 chunk SSE 解析、事件契约映射、工具回环、确认流与空闲超时。
 *
 * 运行：pnpm exec tsx scripts/verify-agent-bff.ts
 * 退出码非 0 表示存在失败断言。
 *
 * 注：脚本内使用 console.* 是刻意的（开发者工具输出），生产代码禁用 console。
 */
import http from "node:http";
import { createHmac } from "node:crypto";
import type { Request, Response } from "express";

import { env } from "../src/config/env.js";
import { AgentHttpClient } from "../src/modules/agent/service/agent-http.client.js";
import { createSseParser } from "../src/modules/agent/service/agent-sse.js";
import { StreamOrchestrator } from "../src/modules/agent/service/stream-orchestrator.js";
import type { ToolRegistry } from "../src/modules/agent/service/tool-registry.js";
import type { PendingCallStore } from "../src/modules/agent/service/pending-call.store.js";
import type {
  AgentChatInput,
  BffStreamEvent,
  PendingToolCall,
  RawToolCall,
} from "../src/modules/agent/types.js";

const SECRET = "verify-secret-shared";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, extra?: unknown): void {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${name}`, extra === undefined ? "" : JSON.stringify(extra));
  }
}

function frame(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

interface FakeAgentHandle {
  url: string;
  requests: Array<{ url: string; body: Record<string, unknown>; authOk: boolean }>;
  close: () => Promise<void>;
}

/** 假 Agent：独立实现一遍 HMAC，验证 BFF 的签名确实被对端接受 */
function startFakeAgent(opts: { hangBody?: boolean } = {}): Promise<FakeAgentHandle> {
  const requests: FakeAgentHandle["requests"] = [];

  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    let body: Record<string, unknown> = {};
    try {
      body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      body = {};
    }

    const token = String(req.headers["x-internal-token"] ?? "");
    const ts = String(req.headers["x-timestamp"] ?? "");
    const expected = createHmac("sha256", SECRET).update(ts).digest("hex");
    const authOk = token === expected && token.length > 0;
    // 健康检查与真身一致：根路径、免 HMAC
    const isPublicProbe = req.url === "/health" || req.url === "/ready";
    requests.push({ url: String(req.url), body, authOk });

    if (opts.hangBody) {
      // 只发响应头不发 body：用于触发 BFF 的空闲超时（而非连接超时）
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.flushHeaders();
      return;
    }

    if (!authOk && !isPublicProbe) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ code: "AUTH", message: "bad signature" }));
      return;
    }

    if (req.url === "/v1/chat") {
      const toolResults = body.tool_results;
      const hasResults = Array.isArray(toolResults) && toolResults.length > 0;
      const userText = String(
        (Array.isArray(body.messages) && (body.messages[0] as { content?: unknown })?.content) || "",
      );

      let frames: string[];
      if (hasResults) {
        frames = [
          frame("start", { message_id: "m-round2" }),
          frame("token", { message_id: "m-round2", delta: "已完成工具调用" }),
          frame("usage", { prompt_tokens: 11, completion_tokens: 7 }),
          frame("end", { finish_reason: "stop" }),
        ];
      } else if (userText.includes("审计")) {
        frames = [
          frame("start", { message_id: "m-confirm" }),
          frame("confirm_required", {
            call_id: "call_audit_1",
            tool_name: "system.audit_note",
            input: { note: "测试备注" },
            message: "即将执行「代用户写审计备注」，请确认",
          }),
          frame("tool_call", {
            call_id: "call_audit_1",
            tool_name: "system.audit_note",
            input: { note: "测试备注" },
          }),
          frame("end", { finish_reason: "tool_call" }),
        ];
      } else {
        frames = [
          frame("start", { message_id: "m-round1" }),
          frame("token", { message_id: "m-round1", delta: "现在是" }),
          // Agent 的 tool_result 回显必须被 BFF 过滤掉，不应出现在前端事件里
          frame("tool_result", { call_id: "x", tool_name: "echo", status: "success" }),
          frame("token", { message_id: "m-round1", delta: "…" }),
          frame("tool_call", {
            call_id: "call_time_1",
            tool_name: "system.current_time",
            input: {},
          }),
          frame("end", { finish_reason: "tool_call" }),
        ];
      }

      res.writeHead(200, { "Content-Type": "text/event-stream" });
      // 故意把 payload 切成 3 个 chunk 写回，验证解析器跨边界安全
      const payload = frames.join("");
      const size = Math.max(1, Math.ceil(payload.length / 3));
      let cursor = 0;
      const timer = setInterval(() => {
        if (cursor >= payload.length) {
          clearInterval(timer);
          res.end();
          return;
        }
        res.write(payload.slice(cursor, cursor + size));
        cursor += size;
      }, 5);
      return;
    }

    const json = (payload: unknown): void => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    };
    if (req.url === "/v1/embed") return json({ embeddings: [[0.1, 0.2]], dim: 2 });
    if (req.url === "/v1/rerank") return json({ results: [{ index: 0, score: 0.9 }] });
    if (req.url === "/v1/ingest") return json({ chunks: 3 });
    if (req.url === "/health") return json({ status: "ok" });
    if (req.url === "/ready") return json({ status: "ready" });

    res.writeHead(404);
    res.end();
  });

  return new Promise((resolve) => {
    // 挂起场景下客户端 abort 后连接可能仍挂着 keep-alive，server.close() 会一直等；
    // 记录 socket 并在关闭时主动 destroy，保证脚本能退出
    const sockets = new Set<import("node:net").Socket>();
    server.on("connection", (s) => {
      sockets.add(s);
      s.on("close", () => sockets.delete(s));
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        close: () =>
          new Promise<void>((r) => {
            for (const s of sockets) s.destroy();
            server.close(() => r());
          }),
      });
    });
  });
}

interface FakeRes {
  statusCode: number;
  raw: string;
  ended: boolean;
  headers: Record<string, string>;
  status(code: number): FakeRes;
  setHeader(k: string, v: string): FakeRes;
  flushHeaders(): void;
  write(chunk: string): boolean;
  end(): void;
  on(event: string, cb: () => void): FakeRes;
  readonly writableEnded: boolean;
}

function createFakeRes(): FakeRes {
  const listeners: Record<string, Array<() => void>> = {};
  let ended = false;
  const res: FakeRes = {
    statusCode: 200,
    raw: "",
    ended: false,
    headers: {},
    status(code) {
      res.statusCode = code;
      return res;
    },
    setHeader(k, v) {
      res.headers[k] = v;
      return res;
    },
    flushHeaders() {
      /* noop */
    },
    write(chunk) {
      res.raw += chunk;
      return true;
    },
    end() {
      ended = true;
      res.ended = true;
      (listeners.close ?? []).forEach((fn) => fn());
    },
    on(event, cb) {
      (listeners[event] ??= []).push(cb);
      return res;
    },
    get writableEnded() {
      return ended;
    },
  };
  return res;
}

const fakeReq = { setTimeout: () => undefined } as unknown as Request;

function parseEvents(raw: string): Array<{ event: string; data: Record<string, unknown> }> {
  const parser = createSseParser();
  return parser
    .push(raw)
    .map((f) => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(f.data) as Record<string, unknown>;
      } catch {
        data = {};
      }
      return { event: f.event, data };
    })
    .filter((e) => Object.keys(e.data).length > 0);
}

interface RecordedCall {
  calls: RawToolCall[];
}

function createFakeTools(record: RecordedCall): ToolRegistry {
  const fake = {
    toAgentSpecs: () => [
      {
        name: "system.current_time",
        description: "获取当前时间",
        parameters: {},
        required_permission: "",
        mutating: false,
        requires_confirmation: false,
      },
    ],
    executeBatch: async (calls: RawToolCall[]) => {
      record.calls.push(...calls);
      const results = calls.map((c) => ({
        call_id: c.callId,
        tool_name: c.toolName,
        status: "success" as const,
        output: { iso: "2026-10-04T00:00:00.000Z" },
        duration_ms: 1,
      }));
      return {
        results,
        events: results.map((r): BffStreamEvent => ({
          type: "toolResult",
          callId: r.call_id,
          toolName: r.tool_name,
          status: "success",
          output: r.output,
          durationMs: r.duration_ms,
        })),
      };
    },
  };
  return fake as unknown as ToolRegistry;
}

function createFakePending(): PendingCallStore & { size: () => number } {
  const store = new Map<string, PendingToolCall>();
  const fake = {
    size: () => store.size,
    save: async (_t: string, _c: string, call: PendingToolCall) => {
      store.set(call.callId, call);
    },
    take: async (_t: string, _c: string, callId: string) => {
      const v = store.get(callId) ?? null;
      store.delete(callId);
      return v;
    },
  };
  return fake as unknown as PendingCallStore & { size: () => number };
}

function baseInput(overrides: Partial<AgentChatInput> = {}): AgentChatInput {
  return {
    tenantId: "t-1",
    userId: "u-1",
    username: "tester",
    roles: ["admin"],
    conversationId: "c-verify",
    message: "现在几点了",
    dataScope: { userId: "u-1", tenantId: "t-1", deptIds: "*", selfOnly: false, roles: ["admin"] },
    traceId: "trace-verify",
    ...overrides,
  };
}

function buildOrchestrator(record: RecordedCall, pending: PendingCallStore): StreamOrchestrator {
  const client = new AgentHttpClient();
  return new StreamOrchestrator({
    client,
    tools: createFakeTools(record),
    pending,
  });
}

async function main(): Promise<void> {
  // env 是普通对象，直接改可避免依赖 .env 里的 Agent 配置
  env.AGENT_ENABLED = true;
  env.AGENT_INTERNAL_SECRET = SECRET;
  env.AGENT_TIMEOUT_MS = "5000";
  env.AGENT_STREAM_IDLE_TIMEOUT_MS = "5000";
  env.AGENT_HEARTBEAT_MS = "60000";
  env.AGENT_MAX_TOOL_ROUNDS = "5";

  const fake = await startFakeAgent();
  env.AGENT_BASE_URL = fake.url;

  // ── 1. HMAC + 工具回环（2 轮） ───────────────────────────────
  console.log("\n[1] HMAC 签名 + 工具回环 2 轮");
  const record: RecordedCall = { calls: [] };
  const pending = createFakePending();
  const orchestrator = buildOrchestrator(record, pending);

  const res = createFakeRes();
  await orchestrator.pipe(fakeReq, res as unknown as Response, baseInput());

  const chatRequests = fake.requests.filter((r) => r.url === "/v1/chat");
  check("上游收到 2 次 /v1/chat（回环 2 轮）", chatRequests.length === 2, chatRequests.length);
  check(
    "全部请求 HMAC 校验通过",
    fake.requests.every((r) => r.authOk),
  );
  check(
    "第二轮请求携带 tool_results",
    Array.isArray(chatRequests[1]?.body.tool_results) &&
      (chatRequests[1].body.tool_results as unknown[]).length === 1,
  );
  check(
    "第二轮 messages 回传首轮 user 文案",
    String((chatRequests[1]?.body.messages as Array<{ content: string }>)?.[0]?.content) ===
      "现在几点了",
  );
  check(
    "响应头含 no-transform（compression 让路）",
    res.headers["Cache-Control"] === "no-cache, no-transform",
  );
  check("响应头为 text/event-stream", String(res.headers["Content-Type"]).startsWith("text/event-stream"));

  const events = parseEvents(res.raw);
  const kinds = events.map((e) => e.event);
  check("事件序列含 start", kinds.includes("start"), kinds);
  // 回环共 2 轮：首轮 2 段 + 次轮 1 段，都应映射为 delta
  const deltaTexts = events.filter((e) => e.event === "delta").map((e) => e.data.text);
  check(
    "token 被映射为 delta（跨轮共 3 段）",
    JSON.stringify(deltaTexts) === JSON.stringify(["现在是", "…", "已完成工具调用"]),
    deltaTexts,
  );
  check("含 toolCall 事件", kinds.includes("toolCall"), kinds);
  check("含 toolResult 事件", kinds.includes("toolResult"), kinds);
  check(
    "Agent 的 tool_result 回显未被转发",
    !events.some((e) => e.data.tool_name === "echo"),
  );
  check("含 usage 事件（跨轮累加）", kinds.includes("usage"), kinds);
  check(
    "usage 累加正确（11/7）",
    (events.find((e) => e.event === "usage")?.data.promptTokens ?? 0) === 11,
  );
  check("末帧为 end(stop)", kinds[kinds.length - 1] === "end" && events[events.length - 1].data.finishReason === "stop", kinds);
  check(
    "delta data 字段名为 text",
    events.find((e) => e.event === "delta")?.data.text === "现在是",
  );
  check("工具被 BFF 执行 1 次", record.calls.length === 1 && record.calls[0].toolName === "system.current_time");

  // ── 2. 确认流 + 一次性消费 ────────────────────────────────────
  console.log("\n[2] 人工确认流 + 待确认调用一次性消费");
  const record2: RecordedCall = { calls: [] };
  const pending2 = createFakePending();
  const orchestrator2 = buildOrchestrator(record2, pending2);

  const res2 = createFakeRes();
  await orchestrator2.pipe(fakeReq, res2 as unknown as Response, baseInput({ message: "写一条审计备注" }));
  const events2 = parseEvents(res2.raw);
  const kinds2 = events2.map((e) => e.event);
  check("确认流下发 confirmRequired", kinds2.includes("confirmRequired"), kinds2);
  check(
    "确认流以 end(confirm_required) 收尾",
    kinds2[kinds2.length - 1] === "end" && events2[events2.length - 1].data.finishReason === "confirm_required",
    kinds2,
  );
  check("待确认调用已暂存（未执行）", pending2.size() === 1 && record2.calls.length === 0);

  // 恢复轮次：带 confirmedCallIds
  const res3 = createFakeRes();
  await orchestrator2.pipe(
    fakeReq,
    res3 as unknown as Response,
    baseInput({ message: undefined, confirmedCallIds: ["call_audit_1"] }),
  );
  const events3 = parseEvents(res3.raw);
  const kinds3 = events3.map((e) => e.event);
  check("恢复轮次执行了已确认工具", record2.calls.length === 1, record2.calls.length);
  check("恢复轮次下发 toolResult", kinds3.includes("toolResult"), kinds3);
  check("恢复轮次以 end(stop) 收尾", events3[events3.length - 1]?.data.finishReason === "stop", kinds3);
  check("待确认调用已被消费（Redis 一次性）", pending2.size() === 0);

  // 过期/篡改的 callId → 应报错（响应头未下发，走标准 JSON 错误）
  let expiredThrown = false;
  try {
    await orchestrator2.pipe(
      fakeReq,
      createFakeRes() as unknown as Response,
      baseInput({ message: undefined, confirmedCallIds: ["call_not_mine"] }),
    );
  } catch (err) {
    expiredThrown = err instanceof Error && err.message.includes("过期");
  }
  check("篡改 callId 被拒绝（AGENT_PENDING_EXPIRED）", expiredThrown);

  // ── 3. 空闲超时 ──────────────────────────────────────────────
  console.log("\n[3] 上游空闲超时");
  const hanging = await startFakeAgent({ hangBody: true });
  const prevBase = env.AGENT_BASE_URL;
  const prevIdle = env.AGENT_STREAM_IDLE_TIMEOUT_MS;
  env.AGENT_BASE_URL = hanging.url;
  env.AGENT_STREAM_IDLE_TIMEOUT_MS = "300";

  const res4 = createFakeRes();
  await buildOrchestrator({ calls: [] }, createFakePending()).pipe(
    fakeReq,
    res4 as unknown as Response,
    baseInput({ message: "挂起测试" }),
  );
  const events4 = parseEvents(res4.raw);
  check(
    "空闲超时下发 error(AGENT_IDLE_TIMEOUT)",
    events4.some((e) => e.event === "error" && e.data.code === "AGENT_IDLE_TIMEOUT"),
    events4.map((e) => e.event),
  );
  env.AGENT_BASE_URL = prevBase;
  env.AGENT_STREAM_IDLE_TIMEOUT_MS = prevIdle;
  await hanging.close();

  // ── 4. 非流式接口 ────────────────────────────────────────────
  console.log("\n[4] 非流式接口（embed / rerank / ingest）");
  const client = new AgentHttpClient();
  const embed = await client.postJson<{ dim: number }>("/embed", { texts: ["你好"] });
  check("embed 返回 dim=2", embed.dim === 2, embed);
  const rerank = await client.postJson<{ results: Array<{ index: number }> }>("/rerank", {
    query: "a",
    documents: ["a", "b"],
    top_n: 1,
  });
  check("rerank 返回 results[0].index=0", rerank.results[0]?.index === 0, rerank);
  const ingest = await client.postJson<{ chunks: number }>("/ingest", {
    tenant_id: "t-1",
    source_type: "doc",
    title: "t",
    content: "c",
  });
  check("ingest 返回 chunks=3", ingest.chunks === 3, ingest);
  const probe = await client.probe();
  check("probe healthy/ready 均为 true", probe.healthy && probe.ready, probe);

  await fake.close();

  console.log(`\n结果：${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("验证脚本异常：", err);
  process.exitCode = 1;
});
