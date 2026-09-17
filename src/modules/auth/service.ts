import { prisma } from "@/config/database.js";
import { compare, hash } from "bcryptjs";
import { redis } from "@/config/redis.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@core/logger/index.js";
import { checkIpAgainstRules } from "../ip-rule/matcher.js";
import { getIpRules } from "../ip-rule/cache.js";
import { clearKickedFlag } from "@/core/ws/force-logout.js";
import { verifyCaptcha } from "./captcha.service.js";
import {
  getPasswordPolicy,
  isPasswordExpired,
  savePasswordHistory,
  validatePasswordHistory,
  validatePasswordStrength,
} from "./password-policy.service.js";
import {
  issueTokens,
  revokeAllSessions,
  revokeSession,
  verifyRefreshToken,
} from "./token.service.js";
import { randomUUID } from "crypto";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { isPlatformAdmin } from "@/common/utils/platform.js";

const LOGIN_FAIL_PREFIX = "login:fail:";
const LOGIN_LOCK_PREFIX = "login:lock:";
const MAX_LOGIN_FAIL = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;

export interface LoginInput {
  tenantCode: string;
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
  deviceId?: string;
  clientIp: string;
  userAgent: string;
}

export class AuthService {
  /** 登录 */
  async login(input: LoginInput) {
    const {
      tenantCode,
      username,
      password,
      captchaId,
      captchaCode,
      clientIp,
      userAgent,
    } = input;

    const failKey = `${LOGIN_FAIL_PREFIX}${tenantCode}:${username}:${clientIp}`;
    const lockKey = `${LOGIN_LOCK_PREFIX}${tenantCode}:${username}:${clientIp}`;

    // 1) 失败 3 次以上要求验证码
    const failCount = await redis.get(failKey);
    if (Number(failCount || 0) >= 3) {
      if (!captchaId || !captchaCode) {
        throw new AppError("请输入图形验证码", 400001, 400);
      }
      if (!(await verifyCaptcha(captchaId, captchaCode))) {
        throw new AppError("验证码错误或已过期", 400001, 400);
      }
    }

    // 2) 检查锁定
    const locked = await redis.get(lockKey);
    if (locked) {
      const ttl = await redis.ttl(lockKey);
      throw new AppError(
        `登录失败次数过多，请 ${Math.ceil(ttl / 60)} 分钟后再试`,
        429001,
        429,
      );
    }

    // 3) 查租户
    const tenant = await prisma.sys_tenant.findFirst({
      where: { tenant_code: tenantCode, is_deleted: 0 },
      select: {
        tenant_id: true,
        tenant_code: true,
        status: true,
        expire_time: true,
      },
    });
    if (!tenant || tenant.status !== "1") {
      await this.recordLoginFail(failKey, lockKey);
      await this.writeLoginLog(
        "",
        null,
        username,
        clientIp,
        userAgent,
        "0",
        "租户不存在或已禁用",
      );
      throw new AppError("租户或用户名或密码错误", 401001, 401);
    }
    if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
      await this.recordLoginFail(failKey, lockKey);
      await this.writeLoginLog(
        tenant.tenant_id,
        null,
        username,
        clientIp,
        userAgent,
        "0",
        "租户已过期",
      );
      throw new AppError("租户已过期", 403001, 403);
    }

    // 4) 查用户
    const user = await prisma.sys_user.findFirst({
      where: { tenant_id: tenant.tenant_id, username, is_deleted: 0 },
    });
    if (!user) {
      await this.recordLoginFail(failKey, lockKey);
      await this.writeLoginLog(
        tenant.tenant_id,
        null,
        username,
        clientIp,
        userAgent,
        "0",
        "用户名不存在",
      );
      throw new AppError("租户或用户名或密码错误", 401001, 401);
    }

    // 5) 校验密码
    if (!(await compare(password, user.password))) {
      await this.recordLoginFail(failKey, lockKey);
      await this.writeLoginLog(
        tenant.tenant_id,
        user.user_id,
        username,
        clientIp,
        userAgent,
        "0",
        "密码错误",
      );
      throw new AppError("租户或用户名或密码错误", 401001, 401);
    }

    if (user.status !== "1") throw new AppError("账号已被禁用", 403001, 403);

    // 6) IP 规则
    const rules = await getIpRules(tenant.tenant_id);
    const ipCheck = checkIpAgainstRules(clientIp, rules);
    if (!ipCheck.allowed) {
      throw new AppError(`访问被拒绝：${ipCheck.reason}`, 403001, 403);
    }

    // 7) 更新最后登录 + 写日志
    await Promise.all([
      prisma.sys_user.update({
        where: { user_id: user.user_id },
        data: { last_login_ip: clientIp, last_login_time: new Date() },
      }),
      this.writeLoginLog(
        tenant.tenant_id,
        user.user_id,
        username,
        clientIp,
        userAgent,
        "1",
        "登录成功",
      ),
    ]);

    // 8) 清理失败计数
    await Promise.all([
      redis.del(failKey),
      redis.del(lockKey),
      clearKickedFlag(user.user_id),
    ]);

    // 9) 加载角色
    const roles = await this.loadRoleCodes(user.user_id, tenant.tenant_id);

    // 10) 签发 token
    const deviceId = this.resolveDeviceId(input.deviceId);
    const tokens = await issueTokens({
      userId: user.user_id,
      tenantId: tenant.tenant_id,
      username: user.username,
      roles,
      deviceId,
    });

    // 11) 密码策略
    const policy = await getPasswordPolicy();
    const mustChange =
      user.must_change_password === 1 ||
      isPasswordExpired(user.password_changed_at, policy);

    // 12) 记录用户-租户关联
    await prisma.sys_user_tenant.upsert({
      where: {
        user_id_tenant_id: {
          user_id: user.user_id,
          tenant_id: tenant.tenant_id,
        },
      },
      update: {},
      create: {
        user_id: user.user_id,
        tenant_id: tenant.tenant_id,
        is_default: 1,
      },
    });

    return {
      ...tokens,
      user: {
        userId: user.user_id,
        username: user.username,
        tenantId: tenant.tenant_id,
        tenantCode: tenant.tenant_code,
        roles,
      },
      mustChangePassword: mustChange,
    };
  }

  /** 刷新令牌 */
  async refresh(refreshToken: string) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload.type !== "refresh")
      throw new AppError("无效的刷新令牌", 401001, 401);

    const { userId, tenantId, deviceId } = payload as any;
    if (!userId || !tenantId || !deviceId)
      throw new AppError("无效的刷新令牌", 401001, 401);

    const stored = await redis.get(`refresh:${tenantId}:${userId}:${deviceId}`);
    if (!stored || stored !== refreshToken)
      throw new AppError("刷新令牌已失效", 401001, 401);

    const user = await prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!user) throw new AppError("无效的刷新令牌", 401001, 401);

    const roles = await this.loadRoleCodes(user.user_id, tenantId);
    await revokeSession(tenantId, userId, deviceId);

    return issueTokens({
      userId,
      tenantId,
      username: user.username,
      roles,
      deviceId,
    });
  }

  /** 登出 */
  async logout(tenantId: string, userId: string, deviceId: string) {
    await revokeSession(tenantId, userId, deviceId);
  }

  /** 修改密码 */
  async changePassword(
    userId: string,
    tenantId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
    });
    if (!user) throw new AppError("用户不存在", 404001, 404);

    if (!(await compare(oldPassword, user.password))) {
      throw new AppError("原密码错误", 400001, 400);
    }

    const policy = await getPasswordPolicy();
    validatePasswordStrength(newPassword, policy);
    await validatePasswordHistory(userId, tenantId, newPassword, policy);

    const hashed = await hash(newPassword, 10);
    await prisma.sys_user.update({
      where: { user_id: userId },
      data: {
        password: hashed,
        password_changed_at: new Date(),
        must_change_password: 0,
        updated_at: new Date(),
      },
    });
    await savePasswordHistory(userId, tenantId, hashed, policy);
  }

  /** 忘记密码 */
  async forgotPassword(
    tenantCode: string,
    username: string,
    oldPassword: string,
    newPassword: string,
    clientIp: string,
  ) {
    const failKey = `${LOGIN_FAIL_PREFIX}reset:${tenantCode}:${username}:${clientIp}`;
    const lockKey = `${LOGIN_LOCK_PREFIX}reset:${tenantCode}:${username}:${clientIp}`;

    const locked = await redis.get(lockKey);
    if (locked) {
      const ttl = await redis.ttl(lockKey);
      throw new AppError(
        `尝试次数过多，请 ${Math.ceil(ttl / 60)} 分钟后再试`,
        429001,
        429,
      );
    }

    const tenant = await prisma.sys_tenant.findFirst({
      where: { tenant_code: tenantCode, is_deleted: 0, status: "1" },
      select: { tenant_id: true, expire_time: true },
    });
    if (!tenant) throw new AppError("租户不存在或已禁用", 404001, 404);
    if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
      throw new AppError("租户已过期", 403001, 403);
    }

    const user = await prisma.sys_user.findFirst({
      where: { tenant_id: tenant.tenant_id, username, is_deleted: 0 },
      select: { user_id: true, password: true },
    });
    if (!user) throw new AppError("用户不存在", 404001, 404);

    if (!(await compare(oldPassword, user.password))) {
      await this.recordLoginFail(failKey, lockKey);
      throw new AppError("原密码错误", 400001, 400);
    }

    const hashed = await hash(newPassword, 10);
    await prisma.sys_user.update({
      where: { user_id: user.user_id },
      data: { password: hashed, updated_at: new Date() },
    });

    await revokeAllSessions(user.user_id);
    await Promise.all([redis.del(failKey), redis.del(lockKey)]);
  }

  /** 获取当前用户信息 */
  async getProfile(userId: string, tenantId: string) {
    const user = await prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      include: {
        sys_user_role: {
          include: {
            role: {
              select: { role_id: true, role_name: true, role_code: true },
            },
          },
        },
        sys_user_dept: {
          include: { dept: { select: { dept_id: true, dept_name: true } } },
        },
      },
    });
    if (!user) throw new AppError("用户不存在", 404001, 404);

    return {
      userId: user.user_id,
      username: user.username,
      realName: user.real_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      tenantId: user.tenant_id,
      roles: user.sys_user_role
        .map((ur: any) => ur.role?.role_name)
        .filter(Boolean),
      depts: user.sys_user_dept
        .map((ud: any) => ud.dept?.dept_name)
        .filter(Boolean),
    };
  }

  /** 更新个人信息 */
  async updateProfile(
    userId: string,
    tenantId: string,
    dto: Record<string, any>,
  ) {
    const updateData = Object.fromEntries(
      Object.entries({
        real_name: dto.realName,
        email: dto.email,
        phone: dto.phone,
        avatar: dto.avatar,
      }).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(updateData).length === 0) return;

    await prisma.sys_user.update({
      where: { user_id: userId },
      data: { ...updateData, updated_at: new Date() },
    });
  }

  /** 获取我的菜单 */
  async getMyMenus(userId: string, tenantId: string) {
    // 1) 用户角色
    const userRoles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      select: { role_id: true },
    });
    if (userRoles.length === 0) return [];
    // 2) 角色关联的菜单
    const roleIds = userRoles.map((r) => r.role_id).filter(Boolean);
    const roleMenus = await prisma.sys_role_menu.findMany({
      where: { role_id: { in: roleIds }, tenant_id: tenantId },
      select: { menu_id: true },
    });
    if (roleMenus.length === 0) return [];
    // ⭐ 过滤 undefined，防止 in 查询带上脏数据
    const menuIds = [
      ...new Set(roleMenus.map((rm) => rm.menu_id).filter(Boolean)),
    ];
    if (menuIds.length === 0) return [];

    // 3) 查菜单
    const isAdmin = await isPlatformAdmin(userId, tenantId);

    const menus = await prisma.sys_menu.findMany({
      where: {
        menu_id: { in: menuIds },
        tenant_id: tenantId,
        status: "1",
        is_deleted: 0,
        menu_type: { in: [1, 2] }, // 只要目录和菜单
        ...(isAdmin ? {} : { is_platform: 0 }),
      },
      orderBy: { sort_order: "asc" },
    });
    // 4) 构建树（返回 camelCase）
    return this.buildMenuTree(menus, null);
  }

  /** 获取我的权限 */
  async getMyPermissions(userId: string, tenantId: string): Promise<string[]> {
    const userRoles = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      select: { role_id: true },
    });
    if (userRoles.length === 0) return [];

    const roleIds = userRoles.map((r) => r.role_id);
    const rolePerms = await prisma.sys_role_permission.findMany({
      where: { role_id: { in: roleIds }, tenant_id: tenantId },
      select: { perm_id: true },
    });
    if (rolePerms.length === 0) return [];

    const permIds = [...new Set(rolePerms.map((rp) => rp.perm_id))];
    const perms = await prisma.sys_permission.findMany({
      where: {
        perm_id: { in: permIds },
        tenant_id: tenantId,
        status: "1",
        is_deleted: 0,
      },
      select: { perm_code: true },
    });
    return perms.map((p) => p.perm_code);
  }

  /** 切换租户 */
  async switchTenant(
    userId: string,
    fromTenantId: string,
    toTenantId: string,
    deviceId: string,
  ) {
    const relation = await prisma.sys_user_tenant.findUnique({
      where: { user_id_tenant_id: { user_id: userId, tenant_id: toTenantId } },
    });
    if (!relation) throw new AppError("无权访问该租户", 403001, 403);

    const tenant = await prisma.sys_tenant.findFirst({
      where: { tenant_id: toTenantId, is_deleted: 0, status: "1" },
    });
    if (!tenant) throw new AppError("租户不存在或已禁用", 404001, 404);
    if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
      throw new AppError("租户已过期", 403001, 403);
    }

    const targetUser = await prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: toTenantId, is_deleted: 0 },
    });
    if (!targetUser) throw new AppError("该租户下不存在您的账号", 403001, 403);

    await revokeSession(fromTenantId, userId, deviceId);

    const roles = await this.loadRoleCodes(userId, toTenantId);
    const tokens = await issueTokens({
      userId,
      tenantId: toTenantId,
      username: targetUser.username,
      roles,
      deviceId,
    });

    return {
      ...tokens,
      user: {
        userId,
        username: targetUser.username,
        tenantId: toTenantId,
        roles,
      },
    };
  }

  /** 用户可访问的租户 */
  async listTenants(userId: string) {
    const relations = await prisma.sys_user_tenant.findMany({
      where: { user_id: userId },
      select: { tenant_id: true },
    });
    const tenants = await prisma.sys_tenant.findMany({
      where: {
        tenant_id: { in: relations.map((r) => r.tenant_id) },
        is_deleted: 0,
        status: "1",
      },
      select: { tenant_id: true, tenant_code: true, tenant_name: true },
    });
    return tenants.map((t) => ({
      tenantId: t.tenant_id,
      tenantCode: t.tenant_code,
      tenantName: t.tenant_name,
    }));
  }

  // ========== private ==========

  private async loadRoleCodes(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const rows = await prisma.sys_user_role.findMany({
      where: { user_id: userId, tenant_id: tenantId },
      include: { role: { select: { role_code: true } } },
    });
    return rows.map((r: any) => r.role?.role_code).filter(Boolean);
  }

  private async recordLoginFail(failKey: string, lockKey: string) {
    const n = await redis.incr(failKey);
    if (n === 1) await redis.expire(failKey, LOGIN_LOCK_SECONDS);
    if (n >= MAX_LOGIN_FAIL) {
      await redis.setex(lockKey, LOGIN_LOCK_SECONDS, "1");
      await redis.del(failKey);
    }
  }

  private resolveDeviceId(input?: string): string {
    if (input && /^[A-Za-z0-9_-]{8,64}$/.test(input)) return input;
    return randomUUID();
  }

  private async writeLoginLog(
    tenantId: string,
    userId: string | null,
    username: string,
    ip: string,
    ua: string,
    status: string,
    message: string,
  ) {
    try {
      await prisma.sys_login_log.create({
        data: {
          tenant_id: tenantId,
          user_id: userId,
          username,
          ip_address: ip,
          user_agent: ua,
          status,
          message,
        },
      });
    } catch (err) {
      logger.error({ err }, "[auth] write login log failed");
    }
  }

  private buildMenuTree(items: any[], parentId: string | null): any[] {
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .filter((item) => {
        // ⭐ 过滤无效项
        if (!item || typeof item !== "object") return false;

        const pid = item.parent_id;
        if (parentId === null) {
          return (
            pid === null ||
            pid === undefined ||
            pid === "" ||
            pid === "00000000-0000-0000-0000-000000000000"
          );
        }
        return pid === parentId;
      })
      .map((item) => {
        const children = this.buildMenuTree(items, item.menu_id);

        const node = keysToCamelCase<any>(item);

        // ⭐ 只在有子节点时才加 children（避免空数组干扰 antd 渲染）
        if (children.length > 0) {
          node.children = children;
        } else {
          delete node.children;
        }

        return node;
      });
  }
}
