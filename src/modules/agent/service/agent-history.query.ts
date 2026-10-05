import { Pool } from "pg";
import { env } from "@/config/env.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import type { AgentConversationRow, AgentMessageRow } from "../types.js";

/** PG 未找到对象（表不存在）：Agent 尚未初始化库时不应让前端整体报错 */
const PG_UNDEFINED_TABLE = "42P01";

/**
 * 跨库只读 Agent 的历史表：独立 pg.Pool，不碰 Prisma，
 * 避免 Prisma schema 与 Agent 侧建表 DDL 重复维护。
 */
let pool: Pool | null = null;

function getPool(): Pool {
  if (!env.AGENT_DATABASE_URL) {
    throw new AppError("未配置 AGENT_DATABASE_URL，无法读取会话历史", 500001, 503);
  }
  pool ??= new Pool({
    connectionString: env.AGENT_DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return pool;
}

function isUndefinedTable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === PG_UNDEFINED_TABLE
  );
}

export async function listConversations(
  tenantId: string,
  userId: string,
  pageNum: number,
  pageSize: number,
): Promise<{ list: AgentConversationRow[]; total: number }> {
  const offset = (pageNum - 1) * pageSize;
  const limit = Math.min(pageSize, Number(env.AGENT_HISTORY_PAGE_SIZE_MAX) || 100);

  try {
    const db = getPool();
    const [rows, count] = await Promise.all([
      // 必须同时带 tenant_id 与 user_id，防跨租户/跨用户越权读取
      db.query<AgentConversationRow>(
        `SELECT m.conversation_id,
                MAX(m.created_at)       AS last_at,
                MIN(m.created_at)       AS first_at,
                COUNT(*)::int           AS message_count,
                COALESCE(s.summary, '') AS summary
         FROM sys_agent_message m
         LEFT JOIN sys_agent_conversation_summary s
                ON s.conversation_id = m.conversation_id AND s.tenant_id = m.tenant_id
         WHERE m.tenant_id = $1 AND m.user_id = $2
         GROUP BY m.conversation_id, s.summary
         ORDER BY last_at DESC
         LIMIT $3 OFFSET $4`,
        [tenantId, userId, limit, offset],
      ),
      db.query<{ total: number }>(
        `SELECT COUNT(DISTINCT conversation_id)::int AS total
         FROM sys_agent_message
         WHERE tenant_id = $1 AND user_id = $2`,
        [tenantId, userId],
      ),
    ]);

    return { list: rows.rows, total: count.rows[0]?.total ?? 0 };
  } catch (err) {
    if (isUndefinedTable(err)) {
      logger.warn({ tenantId }, "[agent-history] 历史表尚未创建，返回空列表");
      return { list: [], total: 0 };
    }
    logger.error({ err, tenantId }, "[agent-history] 会话列表查询失败");
    throw new AppError("会话历史查询失败", 500001, 500);
  }
}

export async function listMessages(
  tenantId: string,
  conversationId: string,
  userId: string,
  limit: number,
  before?: string,
): Promise<AgentMessageRow[]> {
  try {
    const db = getPool();
    // 按 created_at DESC 取最近 N 条，再 reverse 成时间正序（与 Agent load_recent 语义一致）
    const rows = await db.query<AgentMessageRow>(
      `SELECT message_id, conversation_id, role, content, tool_calls,
              tool_call_id, name, tokens, created_at
       FROM sys_agent_message
       WHERE tenant_id = $1 AND conversation_id = $2 AND user_id = $3
         AND ($4::timestamptz IS NULL OR created_at < $4::timestamptz)
       ORDER BY created_at DESC
       LIMIT $5`,
      [tenantId, conversationId, userId, before ?? null, limit],
    );
    return rows.rows.reverse();
  } catch (err) {
    if (isUndefinedTable(err)) {
      logger.warn({ tenantId, conversationId }, "[agent-history] 历史表尚未创建，返回空列表");
      return [];
    }
    logger.error({ err, tenantId, conversationId }, "[agent-history] 消息列表查询失败");
    throw new AppError("会话消息查询失败", 500001, 500);
  }
}

/** 供优雅退出调用；池未创建时直接返回 */
export async function closeAgentHistoryPool(): Promise<void> {
  if (!pool) return;
  const p = pool;
  pool = null;
  await p.end();
}
