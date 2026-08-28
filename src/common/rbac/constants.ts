export const SYSTEM_ROLE = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export const PERMISSION = {
  USER: {
    READ: "user:read",
    WRITE: "user:write",
    DELETE: "user:delete",
    MANAGE: "user:manage",
  },
  FILE: {
    UPLOAD: "file:upload",
    READ: "file:read",
    DELETE: "file:delete",
  },
  LOG: {
    READ: "log:read",
  },
  ROLE: {
    READ: "role:read",
    WRITE: "role:write",
    DELETE: "role:delete",
    MANAGE: "role:manage",
  },
  PERMISSION: {
    READ: "permission:read",
    MANAGE: "permission:manage",
  },
  NOTIFICATION: {
    READ: "notification:read",
    PUBLISH: "notification:publish",
    MANAGE: "notification:manage",
  },
  MENU: {
    READ: "menu:read",
    WRITE: "menu:write",
    DELETE: "menu:delete",
  },
  DICTIONARY: {
    READ: "dictionary:read",
    WRITE: "dictionary:write",
    DELETE: "dictionary:delete",
  },
} as const;

// 系统角色默认权限映射
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  [SYSTEM_ROLE.OWNER]: [
    ...Object.values(PERMISSION.USER).flat(),
    ...Object.values(PERMISSION.FILE).flat(),
    ...Object.values(PERMISSION.LOG).flat(),
    ...Object.values(PERMISSION.ROLE).flat(),
    ...Object.values(PERMISSION.PERMISSION).flat(),
    ...Object.values(PERMISSION.NOTIFICATION).flat(),
    ...Object.values(PERMISSION.MENU).flat(),
    ...Object.values(PERMISSION.DICTIONARY).flat(),
  ],
  [SYSTEM_ROLE.ADMIN]: [
    PERMISSION.USER.READ,
    PERMISSION.USER.WRITE,
    PERMISSION.FILE.UPLOAD,
    PERMISSION.FILE.READ,
    PERMISSION.FILE.DELETE,
    PERMISSION.LOG.READ,
    PERMISSION.ROLE.READ,
    PERMISSION.PERMISSION.READ,
    PERMISSION.NOTIFICATION.READ,
    PERMISSION.NOTIFICATION.PUBLISH,
    PERMISSION.MENU.READ,
    PERMISSION.MENU.WRITE,
    PERMISSION.DICTIONARY.READ,
    PERMISSION.DICTIONARY.WRITE,
  ],
  [SYSTEM_ROLE.MEMBER]: [
    PERMISSION.USER.READ,
    PERMISSION.FILE.UPLOAD,
    PERMISSION.FILE.READ,
    PERMISSION.NOTIFICATION.READ,
    PERMISSION.DICTIONARY.READ,
  ],
  [SYSTEM_ROLE.VIEWER]: [
    PERMISSION.USER.READ,
    PERMISSION.FILE.READ,
    PERMISSION.NOTIFICATION.READ,
    PERMISSION.DICTIONARY.READ,
  ],
};
