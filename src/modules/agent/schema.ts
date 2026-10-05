import { z, type ZodType } from "zod";
import { AppError } from "@/core/errors.js";

/**
 * 为什么不用 @UseMiddleware(validateRequest(...))：UseMiddleware 是方法装饰器，
 * 装饰器自下而上求值，若排在 @Get 之前会先建一条占位路由导致路由重复注册。
 * 用显式助手函数，语义确定、无顺序陷阱。
 */
export function parseAgentBody<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  throw new AppError(
    r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    400001,
    400,
  );
}

export function parseAgentQuery<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  throw new AppError(
    r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    400001,
    400,
  );
}

export const AgentChatRequestSchema = z
  .object({
    conversationId: z.string().min(1).max(64),
    message: z.string().min(1).max(8000).optional(),
    /** 确认续跑时传入；不带 message 时必须有它 */
    confirmedCallIds: z.array(z.string().min(1).max(128)).max(8).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.message) || Boolean(v.confirmedCallIds?.length), {
    message: "message 与 confirmedCallIds 至少提供一个",
  });

export const AgentEmbedRequestSchema = z
  .object({
    texts: z.array(z.string().min(1)).min(1).max(64),
  })
  .strict();

export const AgentRerankRequestSchema = z
  .object({
    query: z.string().min(1).max(2000),
    documents: z.array(z.string().min(1)).min(1).max(200),
    topN: z.coerce.number().int().min(1).max(50).default(5),
  })
  .strict();

// 不含 tenantId —— 租户由 BFF 注入，绝不信任前端传入的租户标识
export const AgentIngestRequestSchema = z
  .object({
    sourceType: z.string().min(1).max(64),
    sourceId: z.string().max(256).optional(),
    title: z.string().min(1).max(512),
    content: z.string().min(1).max(1_000_000),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const AgentConversationListQuerySchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const AgentMessageListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
    /** 游标：取 created_at 早于该 ISO 时间的消息 */
    before: z.string().datetime().optional(),
  })
  .strict();

export type AgentChatRequestDto = z.infer<typeof AgentChatRequestSchema>;
export type AgentEmbedRequestDto = z.infer<typeof AgentEmbedRequestSchema>;
export type AgentRerankRequestDto = z.infer<typeof AgentRerankRequestSchema>;
export type AgentIngestRequestDto = z.infer<typeof AgentIngestRequestSchema>;
export type AgentConversationListQueryDto = z.infer<
  typeof AgentConversationListQuerySchema
>;
export type AgentMessageListQueryDto = z.infer<
  typeof AgentMessageListQuerySchema
>;
