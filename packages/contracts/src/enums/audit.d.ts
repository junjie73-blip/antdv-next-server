/**
 * 审计操作命名规范：{domain}:{action}
 * - 全小写，中划线分隔单词
 * - 前端通过 AUDIT_OP_LABEL 映射展示
 */
export declare const AUDIT_OP: {
    readonly AUTH_LOGIN: "auth:login";
    readonly AUTH_LOGOUT: "auth:logout";
    readonly AUTH_REFRESH: "auth:refresh";
    readonly AUTH_REGISTER: "auth:register";
    readonly AUTH_CHANGE_PWD: "auth:change-password";
    readonly AUTH_RESET_PWD: "auth:reset-password";
    readonly AUTH_CANCEL_ACCOUNT: "auth:cancel-account";
    readonly AUTH_SWITCH_TENANT: "auth:switch-tenant";
    readonly APPROVAL_SUBMIT: "approval:submit";
    readonly APPROVAL_APPROVE: "approval:approve";
    readonly APPROVAL_REJECT: "approval:reject";
    readonly APPROVAL_RESUBMIT: "approval:resubmit";
    readonly USER_CREATE: "user:create";
    readonly USER_UPDATE: "user:update";
    readonly USER_DELETE: "user:delete";
    readonly USER_BATCH_DELETE: "user:batch-delete";
    readonly USER_RESET_PWD: "user:reset-password";
    readonly USER_ASSIGN_ROLE: "user:assign-role";
    readonly USER_ASSIGN_DEPT: "user:assign-dept";
    readonly USER_VIEW_SENSITIVE: "user:view-sensitive";
    readonly USER_IMPORT: "user:import";
    readonly USER_EXPORT: "user:export";
    readonly ROLE_CREATE: "role:create";
    readonly ROLE_UPDATE: "role:update";
    readonly ROLE_DELETE: "role:delete";
    readonly ROLE_ASSIGN_MENU: "role:assign-menu";
    readonly ROLE_ASSIGN_PERM: "role:assign-permission";
    readonly ROLE_ASSIGN_USER: "role:assign-user";
    readonly ROLE_ASSIGN_DEPT: "role:assign-dept";
    readonly PERM_CREATE: "permission:create";
    readonly PERM_UPDATE: "permission:update";
    readonly PERM_DELETE: "permission:delete";
    readonly NOTICE_CREATE: "notice:create";
    readonly NOTICE_UPDATE: "notice:update";
    readonly NOTICE_DELETE: "notice:delete";
    readonly NOTICE_PUBLISH: "notice:publish";
    readonly NOTICE_REVOKE: "notice:revoke";
    readonly NOTICE_TEMPLATE_CREATE: "notice-template:create";
    readonly NOTICE_TEMPLATE_UPDATE: "notice-template:update";
    readonly NOTICE_TEMPLATE_TEST: "notice-template:test-send";
    readonly NOTICE_CHANNEL_UPSERT: "notice-channel:upsert";
    readonly NOTICE_CHANNEL_DELETE: "notice-channel:delete";
    readonly SETTINGS_SITE_UPDATE: "settings:site-update";
    readonly SETTINGS_PWD_POLICY_UPDATE: "settings:password-policy-update";
    readonly SETTINGS_UPLOAD_UPDATE: "settings:upload-update";
    readonly TENANT_CREATE: "tenant:create";
    readonly TENANT_UPDATE: "tenant:update";
    readonly TENANT_DELETE: "tenant:delete";
    readonly TENANT_IMPORT: "tenant:import";
    readonly TENANT_EXPORT: "tenant:export";
    readonly DEPT_CREATE: "dept:create";
    readonly DEPT_UPDATE: "dept:update";
    readonly DEPT_DELETE: "dept:delete";
    readonly MENU_CREATE: "menu:create";
    readonly MENU_UPDATE: "menu:update";
    readonly MENU_DELETE: "menu:delete";
    readonly DICT_TYPE_CREATE: "dict-type:create";
    readonly DICT_DATA_CREATE: "dict-data:create";
    readonly CACHE_CLEAR_GROUP: "cache:clear-group";
    readonly CACHE_DELETE_KEY: "cache:delete-key";
    readonly JOB_RUN_ONCE: "job:run-once";
    readonly JOB_TOGGLE_STATUS: "job:toggle-status";
    readonly JOB_PAUSE: "job:pause";
    readonly JOB_RESUME: "job:resume";
    readonly JOB_LOG_CLEAR: "job-log:clear";
    readonly IP_RULE_CREATE: "ip-rule:create";
    readonly IP_RULE_UPDATE: "ip-rule:update";
    readonly IP_RULE_DELETE: "ip-rule:delete";
    readonly IP_RULE_CHECK: "ip-rule:check";
    readonly FILE_UPLOAD: "file:upload";
    readonly FILE_DELETE: "file:delete";
    readonly FILE_MERGE: "file:merge";
    readonly FILE_CANCEL: "file:cancel";
    readonly ONLINE_KICK: "online:kick";
    readonly ONLINE_KICK_ALL: "online:kick-all";
    readonly AUDIT_DAILY_AGGREGATE: "audit-daily:aggregate";
    readonly AUDIT_DAILY_CLEAN: "audit-daily:clean";
};
export type AuditOperation = (typeof AUDIT_OP)[keyof typeof AUDIT_OP];
/** operation → 中文标签（用于展示） */
export declare const AUDIT_OP_LABEL: Record<string, string>;
/** 反查：{domain}:{action} → label */
export declare function getAuditLabel(operation: string): string;
//# sourceMappingURL=audit.d.ts.map