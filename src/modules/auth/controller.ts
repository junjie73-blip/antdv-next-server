import {
  Controller,
  Post,
  Get,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { prisma } from "@/config/database.js";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import { AppError } from "@/core/errors.js";
import { error, success } from "@/common/utils/response.js";
import {
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RegisterSchema,
  ForgotPasswordSchema,
} from "./schema.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { redis, parseExpirationToSeconds, scanAll } from "@/config/redis.js";
import { env as config } from "@/config/env.js";
import { logger } from "@core/logger/index.js";
import { UserRepository } from "../user/repository.js";
import { getIpRules } from "../ip-rule/cache.js";
import { checkIpAgainstRules } from "../ip-rule/matcher.js";
import { getClientIp } from "@/common/utils/ip.js";
import { isPlatformAdmin } from "@/common/utils/platform.js";
import { clearKickedFlag } from "@/core/ws/force-logout.js";

const ACCESS_SECRET = new TextEncoder().encode(config.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(config.JWT_REFRESH_SECRET);

// ===== 登录失败限制 =====
const LOGIN_FAIL_PREFIX = "login:fail:";
const LOGIN_LOCK_PREFIX = "login:lock:";
const MAX_LOGIN_FAIL = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;

@Controller("/auth", { tags: ["认证"] })
export default class AuthController {
  private userRepository = new UserRepository();

  // ============================================================
  // 内部工具
  // ============================================================

  /**
   * 签发 access + refresh token，并写入 Redis 会话
   * - 多设备：deviceId 区分会话
   * - key 约定：access:{tenantId}:{userId}:{deviceId}
   *              refresh:{tenantId}:{userId}:{deviceId}
   */
  private async issueTokens(
    user: {
      user_id: string;
      tenant_id: string;
      username: string;
      roles?: string[];
    },
    deviceId: string,
  ) {
    const accessPayload = {
      userId: user.user_id,
      tenantId: user.tenant_id,
      username: user.username,
      roles: user.roles ?? [],
      deviceId,
      type: "access",
    };
    const refreshPayload = {
      userId: user.user_id,
      tenantId: user.tenant_id,
      deviceId,
      type: "refresh",
    };

    const accessToken = await new SignJWT(accessPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(config.JWT_EXPIRES_IN)
      .sign(ACCESS_SECRET);

    const refreshToken = await new SignJWT(refreshPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(config.JWT_REFRESH_EXPIRES_IN)
      .sign(REFRESH_SECRET);

    const accessTtl = parseExpirationToSeconds(config.JWT_EXPIRES_IN);
    const refreshTtl = parseExpirationToSeconds(config.JWT_REFRESH_EXPIRES_IN);

    await Promise.all([
      redis.setex(
        `access:${user.tenant_id}:${user.user_id}:${deviceId}`,
        accessTtl,
        "valid",
      ),
      redis.setex(
        `refresh:${user.tenant_id}:${user.user_id}:${deviceId}`,
        refreshTtl,
        refreshToken,
      ),
    ]);

    return { accessToken, refreshToken, deviceId };
  }

  /** 使某个设备上的会话失效 */
  private async revokeSession(
    tenantId: string,
    userId: string,
    deviceId: string,
  ) {
    await Promise.all([
      redis.del(`access:${tenantId}:${userId}:${deviceId}`),
      redis.del(`refresh:${tenantId}:${userId}:${deviceId}`),
    ]);
  }

  /** 记录一次登录失败；达到阈值则锁定 */
  private async recordLoginFail(failKey: string, lockKey: string) {
    const n = await redis.incr(failKey);
    if (n === 1) await redis.expire(failKey, LOGIN_LOCK_SECONDS);
    if (n >= MAX_LOGIN_FAIL) {
      await redis.setex(lockKey, LOGIN_LOCK_SECONDS, "1");
      await redis.del(failKey);
    }
  }

  /** 从请求中提取 deviceId（body → header → 自动生成） */
  private resolveDeviceId(req: Request): string {
    const fromBody = (req.body as any)?.deviceId as string | undefined;
    const fromHeader = req.headers["x-device-id"] as string | undefined;
    const raw = fromBody || fromHeader;
    if (raw && /^[A-Za-z0-9_-]{8,64}$/.test(raw)) return raw;
    return randomUUID();
  }

  /** 统一的错误处理 */
  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "AuthController error");
    error(res, "操作失败", 500, 500);
  }

  /** 加载用户角色 code 列表 */
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

  // ============================================================
  // 登录
  // ============================================================
  @Post("/login")
  @ApiOperation("用户登录")
  @ApiBody(LoginSchema)
  @ApiResponse(200, "登录成功")
  @ApiResponse(401, "租户/用户名/密码错误")
  @ApiResponse(429, "登录失败次数过多")
  async login(@Req() req: Request, @Res() res: Response) {
    const { tenantCode, username, password } = req.body as {
      tenantCode: string;
      username: string;
      password: string;
    };
    const clientIp = getClientIp(req) || "";
    const userAgent = req.headers["user-agent"] || "";

    // 失败计数 key 带上租户编码，避免不同租户同用户名互相影响
    const failKey = `${LOGIN_FAIL_PREFIX}${tenantCode}:${username}:${clientIp}`;
    const lockKey = `${LOGIN_LOCK_PREFIX}${tenantCode}:${username}:${clientIp}`;

    try {
      // 1) 是否被锁定
      const locked = await redis.get(lockKey);
      if (locked) {
        const ttl = await redis.ttl(lockKey);
        throw new AppError(
          `登录失败次数过多，请 ${Math.max(1, Math.ceil(ttl / 60))} 分钟后再试`,
          429001,
          429,
        );
      }

      // ============ 2) 先查租户 ============
      const tenant: any = await prisma.sys_tenant.findFirst({
        where: { tenant_code: tenantCode, is_deleted: 0 },
        select: {
          tenant_id: true,
          status: true,
          expire_time: true,
        },
      });

      // 租户不存在 / 禁用 / 过期 —— 统一提示"用户名或密码错误"，防枚举
      if (!tenant || tenant.status !== "1") {
        await this.recordLoginFail(failKey, lockKey);
        await prisma.sys_login_log.create({
          data: {
            tenant_id: tenant?.tenant_id ?? "",
            user_id: null,
            username,
            ip_address: clientIp,
            user_agent: userAgent,
            status: "0",
            message: "租户不存在或已禁用",
          },
        });
        throw new AppError("租户或用户名或密码错误", 401001, 401);
      }
      if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
        await this.recordLoginFail(failKey, lockKey);
        await prisma.sys_login_log.create({
          data: {
            tenant_id: tenant.tenant_id,
            user_id: null,
            username,
            ip_address: clientIp,
            user_agent: userAgent,
            status: "0",
            message: "租户已过期",
          },
        });
        throw new AppError("租户已过期", 403001, 403);
      }

      // ============ 3) 在租户下查用户 ============
      const user = await prisma.sys_user.findFirst({
        where: {
          tenant_id: tenant.tenant_id,
          username,
          is_deleted: 0,
        },
      });
      if (!user) {
        await this.recordLoginFail(failKey, lockKey);
        await prisma.sys_login_log.create({
          data: {
            tenant_id: tenant.tenant_id,
            user_id: null,
            username,
            ip_address: clientIp,
            user_agent: userAgent,
            status: "0",
            message: "用户名不存在",
          },
        });
        throw new AppError("租户或用户名或密码错误", 401001, 401);
      }

      // ============ 4) 校验密码 ============
      const valid = await compare(password, user.password);
      if (!valid) {
        await this.recordLoginFail(failKey, lockKey);
        await prisma.sys_login_log.create({
          data: {
            tenant_id: tenant.tenant_id,
            user_id: user.user_id,
            username,
            ip_address: clientIp,
            user_agent: userAgent,
            status: "0",
            message: "密码错误",
          },
        });
        throw new AppError("租户或用户名或密码错误", 401001, 401);
      }

      // ============ 5) 用户状态 ============
      if (user.status !== "1") {
        throw new AppError("账号已被禁用", 403001, 403);
      }

      // ============ 6) IP 规则 ============
      const rules = await getIpRules(tenant.tenant_id);
      const check = checkIpAgainstRules(clientIp, rules);
      if (!check.allowed) {
        throw new AppError(`访问被拒绝：${check.reason}`, 403001, 403);
      }

      // ============ 7) 更新最后登录 + 写日志 ============
      await Promise.all([
        prisma.sys_user.update({
          where: { user_id: user.user_id },
          data: { last_login_ip: clientIp, last_login_time: new Date() },
        }),
        prisma.sys_login_log.create({
          data: {
            tenant_id: tenant.tenant_id,
            user_id: user.user_id,
            username,
            ip_address: clientIp,
            user_agent: userAgent,
            status: "1",
            message: "登录成功",
          },
        }),
      ]);

      // ============ 8) 清理失败计数 + kicked ============
      await Promise.all([
        redis.del(failKey),
        redis.del(lockKey),
        clearKickedFlag(user.user_id),
      ]);

      // ============ 9) 加载角色 ============
      const roles = await this.loadRoleCodes(user.user_id, tenant.tenant_id);

      // ============ 10) 签发 token ============
      const deviceId = this.resolveDeviceId(req);
      const tokens = await this.issueTokens(
        { ...user, roles } as any,
        deviceId,
      );

      success(
        res,
        {
          ...tokens,
          user: {
            userId: user.user_id,
            username: user.username,
            tenantId: tenant.tenant_id,
            tenantCode: tenant.tenant_code, // ← 顺便带上，前端方便显示
            roles,
          },
        },
        "登录成功",
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 刷新令牌（轮换）
  // ============================================================
  @Post("/refresh")
  @ApiOperation("刷新令牌")
  @ApiBody(RefreshTokenSchema)
  @ApiResponse(200, "刷新成功")
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const { refreshToken } = req.body as { refreshToken: string };

      // 1) 用 REFRESH_SECRET 校验
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET, {
        clockTolerance: 60,
      });
      if (payload.type !== "refresh") {
        throw new AppError("无效的刷新令牌", 401001, 401);
      }
      const userId = payload.userId as string;
      const tenantId = payload.tenantId as string;
      const deviceId = payload.deviceId as string;
      if (!userId || !tenantId || !deviceId) {
        throw new AppError("无效的刷新令牌", 401001, 401);
      }

      // 2) 与 Redis 中现存 token 比对（防重放 & 支持撤销）
      const stored = await redis.get(
        `refresh:${tenantId}:${userId}:${deviceId}`,
      );
      if (!stored || stored !== refreshToken) {
        throw new AppError("刷新令牌已失效", 401001, 401);
      }

      // 3) 用户有效性
      const user = await prisma.sys_user.findUnique({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      });
      if (!user || user.is_deleted !== 0) {
        throw new AppError("无效的刷新令牌", 401001, 401);
      }

      // 4) 加载角色
      const roles = await this.loadRoleCodes(user.user_id, tenantId);

      // 5) 轮换：作废旧 token → 签发新 token
      await this.revokeSession(tenantId, userId, deviceId);
      const tokens = await this.issueTokens(
        { ...user, roles } as any,
        deviceId,
      );

      success(res, tokens, "刷新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 当前用户信息
  // ============================================================
  @Get("/profile")
  @ApiOperation("获取当前用户信息")
  @ApiResponse(200, "查询成功")
  async profile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      const tenantId = req?.tenantId;
      if (!userId) throw new AppError("未认证", 401001, 401);

      const user = await prisma.sys_user.findUnique({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
        include: {
          sys_user_role: {
            include: {
              role: {
                select: {
                  role_id: true,
                  role_name: true,
                  role_code: true,
                },
              },
            },
          },
          sys_user_dept: {
            include: {
              dept: { select: { dept_id: true, dept_name: true } },
            },
          },
        },
      });
      if (!user) throw new AppError("用户不存在", 404001, 404);

      const roles = user.sys_user_role
        .map((ur: any) => ur.role?.role_name)
        .filter(Boolean);
      const depts = user.sys_user_dept
        .map((ud: any) => ud.dept?.dept_name)
        .filter(Boolean);

      success(res, {
        userId: user.user_id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        tenantId: user.tenant_id,
        roles,
        depts,
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 修改密码
  // ============================================================
  @Put("/password")
  @ApiOperation("修改密码")
  @ApiBody(ChangePasswordSchema)
  @ApiResponse(200, "修改成功")
  async changePassword(@Req() req: Request, @Res() res: Response) {
    try {
      const { oldPassword, newPassword } = req.body as {
        oldPassword: string;
        newPassword: string;
      };
      const userId = req.user?.userId;
      if (!userId) throw new AppError("未认证", 401001, 401);

      const tenantId = req?.tenantId;
      if (!tenantId) throw new AppError("未认证", 401001, 401);

      const user = await prisma.sys_user.findUnique({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      });
      if (!user) throw new AppError("用户不存在", 404001, 404);

      const valid = await compare(oldPassword, user.password);
      if (!valid) throw new AppError("原密码错误", 400001, 400);

      const hashed = await hash(newPassword, 10);
      await prisma.sys_user.update({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
        data: { password: hashed, updated_at: new Date() },
      });

      success(res, null, "密码修改成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 更新个人信息
  // ============================================================
  @Post("/profile")
  @ApiOperation("更新个人信息")
  @ApiBody(UpdateProfileSchema)
  @ApiResponse(200, "更新成功")
  async updateProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new AppError("未认证", 401001, 401);

      const dto = UpdateProfileSchema.parse(req.body);
      const updateData = Object.fromEntries(
        Object.entries({
          real_name: dto.realName,
          email: dto.email,
          phone: dto.phone,
          avatar: dto.avatar,
        }).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(updateData).length === 0) {
        return success(res, null, "没有需要更新的字段");
      }

      const tenantId = req?.tenantId;
      if (!tenantId) throw new AppError("未认证", 401001, 401);

      await prisma.sys_user.update({
        where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
        data: { ...updateData, updated_at: new Date() },
      });
      success(res, null, "个人信息更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 菜单 / 权限
  // ============================================================
  @Get("/menus")
  @ApiOperation("获取当前用户菜单树", "返回当前用户可访问的菜单树")
  @ApiResponse(200, "查询成功")
  async getMyMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;

      const userRoles = await prisma.sys_user_role.findMany({
        where: { user_id: userId, tenant_id: tenantId },
        select: { role_id: true },
      });
      if (userRoles.length === 0) return success(res, [], "查询成功");

      const roleIds = userRoles.map((r) => r.role_id);
      const roleMenus = await prisma.sys_role_menu.findMany({
        where: { role_id: { in: roleIds }, tenant_id: tenantId },
        select: { menu_id: true },
      });
      if (roleMenus.length === 0) return success(res, [], "查询成功");

      const menuIds = [...new Set(roleMenus.map((rm) => rm.menu_id))];
      const isAdmin = await isPlatformAdmin(userId, tenantId);

      const menus = await prisma.sys_menu.findMany({
        where: {
          menu_id: { in: menuIds },
          tenant_id: tenantId,
          status: "1",
          is_deleted: 0,
          menu_type: { in: [1, 2] },
          ...(isAdmin ? {} : { is_platform: 0 }),
        },
        orderBy: { sort_order: "asc" },
      });

      success(res, this.buildMenuTree(menus, null), "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/permissions")
  @ApiOperation("获取当前用户权限列表", "返回当前用户拥有的权限编码数组")
  @ApiResponse(200, "查询成功")
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;

      const userRoles = await prisma.sys_user_role.findMany({
        where: { user_id: userId, tenant_id: tenantId },
        select: { role_id: true },
      });
      if (userRoles.length === 0) return success(res, [], "查询成功");

      const roleIds = userRoles.map((r) => r.role_id);
      const rolePerms = await prisma.sys_role_permission.findMany({
        where: { role_id: { in: roleIds }, tenant_id: tenantId },
        select: { perm_id: true },
      });
      if (rolePerms.length === 0) return success(res, [], "查询成功");

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

      success(
        res,
        perms.map((p) => p.perm_code),
        "查询成功",
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private buildMenuTree(items: any[], parentId: string | null): any[] {
    return items
      .filter((item) => item.parent_id === parentId)
      .map((item) => ({
        ...keysToCamelCase(item),
        children: this.buildMenuTree(items, item.menu_id),
      }));
  }

  // ============================================================
  // 登出（仅当前设备）
  // ============================================================
  @Post("/logout")
  @ApiOperation("登出")
  async logout(@Req() req: Request, @Res() res: Response) {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;
    const deviceId = (req as any).deviceId as string | undefined;

    if (userId && tenantId && deviceId) {
      await this.revokeSession(tenantId, userId, deviceId);
    }
    success(res, null, "登出成功");
  }

  // ============================================================
  // 注册
  // ============================================================
  @Post("/register")
  @ApiOperation("用户注册", "在已存在的租户下注册新用户")
  @ApiBody(RegisterSchema)
  @ApiResponse(200, "注册成功")
  async register(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantCode, tenantName, username, password, email, phone } =
        RegisterSchema.parse(req.body);

      // 1) 租户
      let tenant = await this.userRepository.findTenantByCode(tenantCode);
      if (!tenant) {
        tenant = await this.userRepository.createTenant({
          tenantCode,
          tenantName,
        });
      } else {
        if (tenant.tenant_name !== tenantName) {
          throw new AppError("租户名称与编码不匹配，请核对后重试", 400001, 400);
        }
        if (tenant.status !== "1") {
          throw new AppError("该租户已被禁用，无法注册", 403001, 403);
        }
        if (tenant.expire_time && new Date(tenant.expire_time) < new Date()) {
          throw new AppError("该租户已过期，无法注册", 403001, 403);
        }
      }

      // 2) 创建用户（内部走 bcrypt.hash）
      const user = await this.userRepository.registerUserInTenant({
        tenantId: tenant.tenant_id,
        tenantName: tenant.tenant_name,
        username,
        password,
        email,
        phone,
      });

      // 3) 首个用户 → 初始化租户数据
      const userCount = await prisma.sys_user.count({
        where: { tenant_id: tenant.tenant_id, is_deleted: 0 },
      });
      if (userCount === 1) {
        try {
          await this.userRepository.initTenantData(
            tenant.tenant_id,
            user.user_id,
          );
        } catch (initErr) {
          logger.error({ err: initErr }, "[register] 租户数据初始化失败");
        }
      }

      success(
        res,
        {
          tenantId: tenant.tenant_id,
          userId: user.user_id,
          username: user.username,
          isNewTenant: userCount === 1,
        },
        "注册成功",
        200,
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Post("/forgot-password")
  @ApiOperation("忘记密码")
  async forgotPassword(@Req() req, @Res() res) {
    const clientIp = getClientIp(req) || "unknown";
    try {
      const { tenantCode, username, oldPassword, newPassword } =
        ForgotPasswordSchema.parse(req.body);

      const failKey = `${LOGIN_FAIL_PREFIX}reset:${tenantCode}:${username}:${clientIp}`;
      const lockKey = `${LOGIN_LOCK_PREFIX}reset:${tenantCode}:${username}:${clientIp}`;

      const locked = await redis.get(lockKey);
      if (locked) {
        const ttl = await redis.ttl(lockKey);
        throw new AppError(
          `尝试次数过多，请 ${Math.max(1, Math.ceil(ttl / 60))} 分钟后再试`,
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

      const valid = await compare(oldPassword, user.password);
      if (!valid) {
        await this.recordLoginFail(failKey, lockKey); // ⭐
        throw new AppError("原密码错误", 400001, 400);
      }

      const hashed = await hash(newPassword, 10);
      await prisma.sys_user.update({
        where: { user_id: user.user_id },
        data: { password: hashed, updated_at: new Date() },
      });

      // 撤销所有会话
      const accessKeys = await scanAll(`access:*:${user.user_id}:*`);
      const refreshKeys = await scanAll(`refresh:*:${user.user_id}:*`);
      if (accessKeys.length) await redis.del(...accessKeys);
      if (refreshKeys.length) await redis.del(...refreshKeys);

      // 清失败计数
      await redis.del(failKey);
      await redis.del(lockKey);

      success(res, null, "密码重置成功，请重新登录");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
