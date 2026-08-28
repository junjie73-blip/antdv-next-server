export enum Permission {
  USER_READ = "user:read",
  USER_WRITE = "user:write",
  USER_DELETE = "user:delete",
  FILE_READ = "file:read",
  FILE_WRITE = "file:write",
  SETTING_READ = "setting:read",
  SETTING_WRITE = "setting:write",
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: Object.values(Permission),
  ADMIN: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.FILE_READ,
    Permission.FILE_WRITE,
    Permission.SETTING_READ,
    Permission.SETTING_WRITE,
  ],
  MEMBER: [Permission.USER_READ, Permission.FILE_READ, Permission.FILE_WRITE],
  VIEWER: [Permission.USER_READ, Permission.FILE_READ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

export function requirePermission(...permissions: Permission[]) {
  return (req: any, res: any, next: any) => {
    const role = req.user?.role;
    if (!role || !permissions.every((p) => hasPermission(role, p))) {
      return res.status(403).json({ success: false, message: "权限不足" });
    }
    next();
  };
}
