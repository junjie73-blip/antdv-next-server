import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { MESSAGE_BIZ_TYPES } from "./constants.js";

extendZodWithOpenApi(z);

/* ============================================================
 * 我的消息列表
 * ============================================================ */
export const MyMessageListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    /** 0-未读 1-已读；不传=全部 */
    isRead: z.coerce.number().int().min(0).max(1).optional(),
    bizType: z.enum(MESSAGE_BIZ_TYPES as [string, ...string[]]).optional(),
    keyword: z.string().max(128).optional(),
  })
  .openapi("MyMessageList");

/* ============================================================
 * 批量已读
 * ============================================================ */
export const BatchReadSchema = z
  .object({
    messageIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .openapi("MessageBatchRead");

/* ============================================================
 * 批量删除
 * ============================================================ */
export const BatchDeleteSchema = z
  .object({
    messageIds: z.array(z.string().uuid()).min(1).max(100),
  })
  .openapi("MessageBatchDelete");

/* ============================================================
 * 标记全部已读
 * ============================================================ */
export const ReadAllSchema = z
  .object({
    bizType: z.enum(MESSAGE_BIZ_TYPES as [string, ...string[]]).optional(),
  })
  .openapi("MessageReadAll");

/* ============================================================
 * 内部推送（供系统/管理员调用）
 * ============================================================ */
export const PushMessageSchema = z
  .object({
    userIds: z.array(z.string().uuid()).min(1).max(1000),
    bizType: z.enum(MESSAGE_BIZ_TYPES as [string, ...string[]]),
    bizId: z.string().uuid().nullable().optional(),
    title: z.string().min(1).max(256),
    content: z.string().max(20000).optional().nullable(),
    priority: z.number().int().min(0).max(2).default(0),
    isTop: z.number().int().min(0).max(1).default(0),
    expireAt: z.coerce.date().nullable().optional(),
    realtime: z.boolean().default(true),
  })
  .openapi("MessagePush");

export type MyMessageListDTO = z.infer<typeof MyMessageListSchema>;
export type BatchReadDTO = z.infer<typeof BatchReadSchema>;
export type BatchDeleteDTO = z.infer<typeof BatchDeleteSchema>;
export type ReadAllDTO = z.infer<typeof ReadAllSchema>;
export type PushMessageDTO = z.infer<typeof PushMessageSchema>;
