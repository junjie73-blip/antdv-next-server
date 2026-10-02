import type { MessageBizType } from "./constants.js";

/** sys_message 实体 */
export interface MessageEntity {
  message_id: string;
  tenant_id: string;
  user_id: string;
  biz_type: string;
  biz_id: string | null;
  title: string;
  content: string | null;
  priority: number;
  is_read: number;
  read_at: Date | null;
  is_top: number;
  expire_at: Date | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: number;
}

/** 用户侧列表查询参数 */
export interface MyMessageQuery {
  pageNum?: number;
  pageSize?: number;
  isRead?: number;
  bizType?: string;
  keyword?: string;
}

/** 推送单条消息参数（供内部调用） */
export interface PushMessageParams {
  tenantId: string;
  userIds: string[];
  bizType: MessageBizType | string;
  bizId?: string | null;
  title: string;
  content?: string | null;
  priority?: number;
  isTop?: number;
  expireAt?: Date | null;
  /** 是否通过 WebSocket 实时推送（默认 true） */
  realtime?: boolean;
}

/** 未读数汇总 */
export interface UnreadSummary {
  total: number;
  byType: Record<string, number>;
}
