export interface SendContext {
  tenantId: string;
  noticeId?: string;
  title: string;
  content?: string;
  /** 收件人：邮箱 / 手机号 / URL */
  receivers: string[];
  /** 渠道原始配置（解析后的 JSON） */
  config: Record<string, any>;
}

export interface SendResult {
  channel: string;
  total: number;
  success: number;
  failed: number;
  errors: { receiver: string; reason: string }[];
}

export interface NoticeChannel {
  readonly type: string;
  /** 渠道是否已就绪（配置齐全） */
  isReady(config: Record<string, any>): boolean;
  send(ctx: SendContext): Promise<SendResult>;
}
