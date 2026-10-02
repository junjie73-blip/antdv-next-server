export interface SmsSendParams {
  /** 完整手机号（含国际区号，如 +8613800138000）或国内 11 位 */
  phone: string;
  /** 短信模板 ID / code */
  templateId: string;
  /** 模板参数（各厂商命名不同，用统一 map） */
  params: Record<string, string>;
  /** 签名（可选，覆盖 config 里的） */
  signName?: string;
}

export interface SmsSendResult {
  phone: string;
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SmsClient {
  readonly provider: string;
  /**
   * 批量发送（内部可串行或并行，由实现决定）
   */
  sendBatch(params: SmsSendParams[]): Promise<SmsSendResult[]>;
  /**
   * 单条发送便捷方法
   */
  send(params: SmsSendParams): Promise<SmsSendResult>;
}

export interface SmsConfig {
  provider: string;
  /** 阿里云/腾讯云用 */
  accessKey?: string;
  accessKeySecret?: string;
  accessKeyId?: string;
  secretKey?: string;
  secretId?: string;
  /** 华为云用 */
  appKey?: string;
  appSecret?: string;
  /** 签名 */
  signName?: string;
  /** 默认模板 */
  defaultTemplateId?: string;
  /** 短信 API 地域 */
  region?: string;
  /** 华为云 endpoint */
  endpoint?: string;
  /** 华为云通道号 */
  sender?: string;
}
