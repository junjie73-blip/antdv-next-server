export const AUDIT_OP = {
  // 认证
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_REFRESH: "auth:refresh",
  AUTH_REGISTER: "auth:register",
  AUTH_CHANGE_PWD: "auth:change-password",
  AUTH_RESET_PWD: "auth:reset-password",
  AUTH_CANCEL_ACCOUNT: "auth:cancel-account",

  // 审批
  APPROVAL_SUBMIT: "approval:submit",
  APPROVAL_APPROVE: "approval:approve",
  APPROVAL_REJECT: "approval:reject",
  APPROVAL_RESUBMIT: "approval:resubmit",

  // 用户
  USER_CREATE: "user:create",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_RESET_PWD: "user:reset-password",
  USER_ASSIGN_ROLE: "user:assign-role",
  USER_ASSIGN_DEPT: "user:assign-dept",
  USER_VIEW_SENSITIVE: "user:view-sensitive",

  // 角色 / 权限
  ROLE_CREATE: "role:create",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_ASSIGN_MENU: "role:assign-menu",
  ROLE_ASSIGN_PERM: "role:assign-permission",
  ROLE_ASSIGN_USER: "role:assign-user",

  // 通知
  NOTICE_CREATE: "notice:create",
  NOTICE_PUBLISH: "notice:publish",
  NOTICE_REVOKE: "notice:revoke",
  NOTICE_TEMPLATE_CREATE: "notice-template:create",
  NOTICE_TEMPLATE_UPDATE: "notice-template:update",
  NOTICE_TEMPLATE_TEST: "notice-template:test-send",

  // 系统
  SETTINGS_SITE_UPDATE: "settings:site-update",
  SETTINGS_PWD_POLICY_UPDATE: "settings:password-policy-update",
  SETTINGS_UPLOAD_UPDATE: "settings:upload-update",
  TENANT_CREATE: "tenant:create",
  TENANT_UPDATE: "tenant:update",
  TENANT_DELETE: "tenant:delete",

  // 缓存 / 监控
  CACHE_CLEAR_GROUP: "cache:clear-group",
  CACHE_DELETE_KEY: "cache:delete-key",
  JOB_RUN_ONCE: "job:run-once",
  JOB_TOGGLE: "job:toggle-status",
  IP_RULE_CREATE: "ip-rule:create",
  IP_RULE_UPDATE: "ip-rule:update",
  IP_RULE_DELETE: "ip-rule:delete",
} as const;

export type AuditOperation = (typeof AUDIT_OP)[keyof typeof AUDIT_OP];

/** operation → 中文标签 */
export const AUDIT_OP_LABEL: Record<string, string> = {
  [AUDIT_OP.AUTH_LOGIN]: "用户登录",
  [AUDIT_OP.AUTH_LOGOUT]: "用户登出",
  [AUDIT_OP.AUTH_REGISTER]: "用户注册",
  [AUDIT_OP.AUTH_CHANGE_PWD]: "修改密码",
  [AUDIT_OP.AUTH_CANCEL_ACCOUNT]: "提交注销申请",
  [AUDIT_OP.APPROVAL_SUBMIT]: "提交审批申请",
  [AUDIT_OP.APPROVAL_APPROVE]: "审批通过",
  [AUDIT_OP.APPROVAL_REJECT]: "审批驳回",
  [AUDIT_OP.APPROVAL_RESUBMIT]: "重新提交审批",
  [AUDIT_OP.USER_CREATE]: "创建用户",
  [AUDIT_OP.USER_DELETE]: "删除用户",
  [AUDIT_OP.USER_VIEW_SENSITIVE]: "查看用户敏感信息",
  [AUDIT_OP.ROLE_CREATE]: "创建角色",
  [AUDIT_OP.ROLE_UPDATE]: "更新角色",
  [AUDIT_OP.ROLE_DELETE]: "删除角色",
  [AUDIT_OP.ROLE_ASSIGN_MENU]: "分配角色菜单",
  [AUDIT_OP.ROLE_ASSIGN_PERM]: "分配角色权限",
  [AUDIT_OP.ROLE_ASSIGN_USER]: "分配角色用户",
  [AUDIT_OP.NOTICE_PUBLISH]: "发布通知",
  [AUDIT_OP.NOTICE_REVOKE]: "撤回通知",
  [AUDIT_OP.CACHE_CLEAR_GROUP]: "清空缓存组",
  [AUDIT_OP.CACHE_DELETE_KEY]: "删除缓存键",
  [AUDIT_OP.JOB_RUN_ONCE]: "手动执行任务",
  [AUDIT_OP.JOB_TOGGLE]: "切换任务状态",
  [AUDIT_OP.IP_RULE_CREATE]: "创建IP规则",
  [AUDIT_OP.IP_RULE_UPDATE]: "更新IP规则",
  [AUDIT_OP.IP_RULE_DELETE]: "删除IP规则",
  [AUDIT_OP.TENANT_CREATE]: "创建租户",
  [AUDIT_OP.TENANT_UPDATE]: "更新租户",
  [AUDIT_OP.TENANT_DELETE]: "删除租户",
  [AUDIT_OP.SETTINGS_SITE_UPDATE]: "更新站点配置",
  [AUDIT_OP.SETTINGS_PWD_POLICY_UPDATE]: "更新密码策略",
  [AUDIT_OP.SETTINGS_UPLOAD_UPDATE]: "更新上传配置",
  [AUDIT_OP.NOTICE_TEMPLATE_CREATE]: "创建通知模板",
  [AUDIT_OP.NOTICE_TEMPLATE_UPDATE]: "更新通知模板",
  [AUDIT_OP.NOTICE_TEMPLATE_TEST]: "测试发送通知模板",
  [AUDIT_OP.NOTICE_CREATE]: "创建通知",
};
