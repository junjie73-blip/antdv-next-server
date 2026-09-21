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
] as const;
