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

export const CACHE_GROUPS: CacheGroup[] = [
  { prefix: "login:fail:", name: "login-fail", remark: "登录失败缓存" },
  { prefix: "login:lock:", name: "login-lock", remark: "登录锁定缓存" },
  { name: "access", prefix: "access:", remark: "访问缓存" },
  { name: "refresh", prefix: "refresh:", remark: "刷新缓存" },
  { name: "captcha", prefix: "captcha:", remark: "验证码缓存" },
  { name: "mfa", prefix: "mfa:", remark: "MFA 缓存" },
  { name: "upload-rate", prefix: "upload:rate:", remark: "上传限流" },
  { name: "upload-bytes", prefix: "upload:bytes:", remark: "上传流量统计" },
  { prefix: "bull:", name: "bull", remark: "任务队列" },
  { prefix: "rbac:", name: "rbac", remark: "RBAC 权限缓存" },
  { prefix: "rate-limit:", name: "rate-limit", remark: "限流" },
  {
    prefix: "rate-limit:offense:",
    name: "rate-limit-offense",
    remark: "限流违规",
  },
  {
    prefix: "rate-limit:block:",
    name: "rate-limit-block",
    remark: "限流拒绝",
  },
  { prefix: "ip-rule:", name: "ip-rule", remark: "IP 规则" },
  { prefix: "session:", name: "session", remark: "会话" },
  { prefix: "notice:", name: "notice", remark: "通知" },
  { prefix: "password-policy:", name: "password-policy", remark: "密码策略" },
  { prefix: "data-scope:", name: "data-scope", remark: "数据权限缓存" },
  { prefix: "cache:total:", name: "cache-total", remark: "缓存总数" },
  {
    prefix: "user:force-logout:",
    name: "user-force-logout",
    remark: "踢下线缓存",
  },
  { prefix: "tenant:info:", name: "tenant-info", remark: "租户信息缓存" },
];

export const KEY_SEPARATOR = ":";
export const KEY_PREFIX_MAX_DEPTH = 2;
export const SCAN_BATCH_SIZE = 500;
export const SCAN_MAX_KEYS = 100_000;
export const UNCLASSIFIED_REMARK = "未分类缓存";
