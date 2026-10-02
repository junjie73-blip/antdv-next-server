export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
}

export interface RBACContext {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface RequiredPermission {
  resource: string;
  action: PermissionAction;
}

export const SYSTEM_PERMISSIONS = [
  {
    perm_code: "user:create",
    perm_name: "创建用户",
    resource_type: "user",
    action: "create",
  },
  {
    perm_code: "user:read",
    perm_name: "查看用户",
    resource_type: "user",
    action: "read",
  },
  {
    perm_code: "user:update",
    perm_name: "更新用户",
    resource_type: "user",
    action: "update",
  },
  {
    perm_code: "user:delete",
    perm_name: "删除用户",
    resource_type: "user",
    action: "delete",
  },
  {
    perm_code: "role:create",
    perm_name: "创建角色",
    resource_type: "role",
    action: "create",
  },
  {
    perm_code: "role:read",
    perm_name: "查看角色",
    resource_type: "role",
    action: "read",
  },
  {
    perm_code: "role:update",
    perm_name: "更新角色",
    resource_type: "role",
    action: "update",
  },
  {
    perm_code: "role:delete",
    perm_name: "删除角色",
    resource_type: "role",
    action: "delete",
  },
  {
    perm_code: "permission:manage",
    perm_name: "管理权限",
    resource_type: "permission",
    action: "manage",
  },
  {
    perm_code: "tenant:manage",
    perm_name: "租户管理",
    resource_type: "tenant",
    action: "manage",
  },
  {
    perm_code: "system:audit",
    perm_name: "审计日志",
    resource_type: "system",
    action: "read",
  },
  {
    perm_code: "system:cache:manage",
    perm_name: "缓存管理",
    resource_type: "system",
    action: "manage",
  },
  {
    perm_code: "*",
    perm_name: "超级管理员",
    resource_type: "*",
    action: "manage",
  },
  {
    perm_code: "user-group:list",
    perm_name: "查看用户组",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "user-group:create",
    perm_name: "创建用户组",
    resource_type: "api",
    action: "create",
  },
  {
    perm_code: "user-group:update",
    perm_name: "更新用户组",
    resource_type: "api",
    action: "update",
  },
  {
    perm_code: "user-group:delete",
    perm_name: "删除用户组",
    resource_type: "api",
    action: "delete",
  },
  {
    perm_code: "user-group:manage-member",
    perm_name: "管理用户组成员",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "user-group:manage-role",
    perm_name: "管理用户组角色",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "login-security:list-abnormal",
    perm_name: "查看异常登录",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "archive:policy:list",
    perm_name: "查看归档策略",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "archive:policy:update",
    perm_name: "更新归档策略",
    resource_type: "api",
    action: "update",
  },
  {
    perm_code: "archive:policy:trigger",
    perm_name: "手动触发归档",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "archive:log:list",
    perm_name: "查看归档日志",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "monitor:slow-query:list",
    perm_name: "查看慢查询",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "monitor:slow-query:review",
    perm_name: "标记慢查询",
    resource_type: "api",
    action: "manage",
  }, // 存储后端
  {
    perm_code: "system:storage:list",
    perm_name: "查看存储后端",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "system:storage:manage",
    perm_name: "管理存储后端",
    resource_type: "api",
    action: "manage",
  },

  // 字段脱敏
  {
    perm_code: "system:field-mask:list",
    perm_name: "查看脱敏策略",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "system:field-mask:manage",
    perm_name: "管理脱敏策略",
    resource_type: "api",
    action: "manage",
  },

  // 代码生成器模板
  {
    perm_code: "tool:gen:template:list",
    perm_name: "查看模板",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "tool:gen:template:manage",
    perm_name: "管理模板",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "system:queue:manage",
    perm_name: "管理队列",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "monitor:logs:list",
    perm_name: "查看日志",
    resource_type: "api",
    action: "list",
  },
  {
    perm_code: "monitor:logs:query",
    perm_name: "LogQL 查询",
    resource_type: "api",
    action: "query",
  },
  {
    perm_code: "system:queue:manage",
    perm_name: "管理队列",
    resource_type: "api",
    action: "manage",
  },
  {
    perm_code: "system:cache:manage",
    perm_name: "管理缓存",
    resource_type: "api",
    action: "manage",
  },
] as const;
