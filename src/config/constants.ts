export const NOTICE_PRIORITY = {
  NORMAL: 0,
  IMPORTANT: 1,
  URGENT: 2,
} as const;

export interface CacheGroup {
  name: string;
  prefix: string;
  remark: string;
}

/**
 * 缓存前缀分组
 *
 * ⚠️ 排序规则：
 *   1. 更长的前缀必须排在更短的前缀之前（如 "rate-limit:offense:" 在 "rate-limit:" 之前）
 *   2. 同类业务聚在一起
 *   3. 平台级 / 业务级 / 会话级分开
 */
export const CACHE_GROUPS: CacheGroup[] = [
  // ============ 登录 / 会话 ============
  { prefix: "login:fail:", name: "login-fail", remark: "登录失败缓存" },
  { prefix: "login:lock:", name: "login-lock", remark: "登录锁定缓存" },
  { prefix: "access:", name: "access", remark: "访问令牌会话" },
  { prefix: "refresh:", name: "refresh", remark: "刷新令牌会话" },
  { prefix: "session:", name: "session", remark: "通用会话" },
  { prefix: "kicked:", name: "kicked", remark: "强制下线标记" },
  { prefix: "pwd:reset:", name: "pwd-reset", remark: "密码重置令牌" },
  { prefix: "captcha:", name: "captcha", remark: "图形验证码" },
  { prefix: "mfa:", name: "mfa", remark: "MFA 相关缓存" },
  { prefix: "email:code:", name: "email-code", remark: "邮箱验证码" },
  { prefix: "email:verify:", name: "email-verify", remark: "邮箱验证失败计数" },

  // ============ 限流（长前缀在前）============
  {
    prefix: "rate-limit:offense:",
    name: "rate-limit-offense",
    remark: "限流违规记录",
  },
  {
    prefix: "rate-limit:block:",
    name: "rate-limit-block",
    remark: "限流拒绝记录",
  },
  { prefix: "rate-limit:", name: "rate-limit", remark: "限流计数" },
  { prefix: "upload:rate:", name: "upload-rate", remark: "上传限流" },
  { prefix: "upload:bytes:", name: "upload-bytes", remark: "上传流量统计" },

  // ============ 权限 / 数据权限 ============
  { prefix: "rbac:", name: "rbac", remark: "RBAC 权限缓存" },
  { prefix: "data-scope:", name: "data-scope", remark: "数据权限缓存" },
  { prefix: "user-group:", name: "user-group", remark: "用户组缓存" },
  { prefix: "field-mask:", name: "field-mask", remark: "字段脱敏策略缓存" },
  {
    prefix: "user:force-logout:",
    name: "user-force-logout",
    remark: "踢下线缓存",
  },

  // ============ 系统配置 ============
  { prefix: "config:", name: "config", remark: "系统配置缓存" },
  { prefix: "password-policy:", name: "password-policy", remark: "密码策略" },
  { prefix: "tenant:info:", name: "tenant-info", remark: "租户信息缓存" },
  { prefix: "ip-rule:", name: "ip-rule", remark: "IP 白黑名单规则" },
  { prefix: "api-version:", name: "api-version", remark: "API 版本信息" },
  { prefix: "archive-policy:", name: "archive-policy", remark: "归档策略配置" },
  {
    prefix: "storage-backend:",
    name: "storage-backend",
    remark: "存储后端配置",
  },

  // ============ 通知 / 消息 ============
  { prefix: "notice:", name: "notice", remark: "通知业务缓存" },
  { prefix: "notice-pref:", name: "notice-pref", remark: "通知订阅偏好" },
  { prefix: "message:", name: "message", remark: "消息中心业务缓存" },
  { prefix: "msg-center:", name: "msg-center", remark: "消息中心聚合缓存" },

  // ============ 工作流 ============
  { prefix: "wf:", name: "wf", remark: "工作流缓存" },

  // ============ 代码生成器 ============
  {
    prefix: "gen-template:",
    name: "gen-template",
    remark: "代码生成器模板缓存",
  },

  // ============ 监控 ============
  { prefix: "slow-query:", name: "slow-query", remark: "慢查询分析缓存" },

  // ============ 队列 / 任务 ============
  { prefix: "bull:", name: "bull", remark: "BullMQ 任务队列" },
  { prefix: "job:lock:", name: "job-lock", remark: "定时任务锁" },

  // ============ 通用 ============
  { prefix: "cache:total:", name: "cache-total", remark: "分页总数缓存" },
  { prefix: "cache:ver:", name: "cache-ver", remark: "缓存版本号" },
  { prefix: "geoip:", name: "geoip", remark: "IP 归属地缓存" },
];

export const KEY_SEPARATOR = ":";
export const KEY_PREFIX_MAX_DEPTH = 2;
export const SCAN_BATCH_SIZE = 500;
export const SCAN_MAX_KEYS = 100_000;
export const UNCLASSIFIED_REMARK = "未分类缓存";

/**
 * ⭐ 禁止清理的前缀（即使属于白名单）
 * 用于缓存监控面板的"清空组"操作，防止误清关键会话
 */
export const FORBIDDEN_CLEAR_PREFIXES = [
  "access:",
  "refresh:",
  "session:",
  "kicked:",
  "rbac:",
  "login:lock:",
] as const;

export function isForbiddenClear(prefix: string): boolean {
  return FORBIDDEN_CLEAR_PREFIXES.some((p) => prefix.startsWith(p));
}

/**
 * ⭐ 匹配缓存分组（长前缀优先）
 */
export function classifyCacheKey(key: string): CacheGroup | null {
  // 显式排序：长前缀优先
  const sorted = [...CACHE_GROUPS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  return sorted.find((g) => key.startsWith(g.prefix)) ?? null;
}
