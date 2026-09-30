/** 模板变量定义 */
export interface TemplateParam {
  name: string; // 变量名，如 userName
  label: string; // 显示名，如 "用户名"
  type: "string" | "number" | "date" | "boolean";
  required?: boolean; // 是否必填
  defaultValue?: unknown; // 默认值
  description?: string; // 说明
}

/** 渠道类型 */
export type ChannelType =
  | "email"
  | "sms"
  | "webhook"
  | "wechat_work"
  | "dingtalk";
