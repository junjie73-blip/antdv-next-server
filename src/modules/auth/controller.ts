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
import { AppError } from "@/middleware/error-handler.js";
import { error, success } from "@/common/utils/response.js";
import {
  LoginSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  UpdateProfileSchema,
  RegisterSchema,
} from "./schema.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";
import { decrypt, encrypt } from "@/common/utils/crypto.js";
import { redis } from "@/config/redis.js";
import { UserRepository } from "../user/repository.js";
import { generateTokens } from "@/middleware/auth.js";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);
@Controller("/auth", { tags: ["认证"] })
export default class AuthController {
  private userRepository = new UserRepository();
  private async generateTokens(user: any) {
    const basePayload = {
      userId: user.user_id,
      tenantId: user.tenant_id,
      username: user.username,
    };

    return generateTokens(basePayload);
  }

  @Post("/login")
  @ApiOperation("用户登录")
  @ApiBody(LoginSchema)
  @ApiResponse(200, "登录成功")
  @ApiResponse(401, "用户名或密码错误")
  async login(@Req() req: Request, @Res() res: Response) {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    try {
      const user = await prisma.sys_user.findFirst({
        where: { username, is_deleted: 0 },
      });
      console.log(user, "user", username);
      if (!user) {
        // 记录登录失败日志
        await prisma.sys_login_log.create({
          data: {
            tenant_id: user?.tenant_id || null, // 可能没有租户信息，使用 null 或已知租户
            user_id: null,
            username,
            ip_address: ip,
            user_agent: userAgent,
            status: "0",
            message: "用户名不存在",
          },
        });
        throw new AppError(401, "用户名或密码错误", 401);
      }

      const valid = decrypt(user.password) === password;
      if (!valid) {
        // 记录登录失败日志
        await prisma.sys_login_log.create({
          data: {
            tenant_id: user.tenant_id,
            user_id: user.user_id,
            username,
            ip_address: ip,
            user_agent: userAgent,
            status: "0",
            message: "密码错误",
          },
        });
        throw new AppError(401, "用户名或密码错误", 401);
      }

      // 检查租户状态
      const tenant = await prisma.sys_tenant.findUnique({
        where: { tenant_id: user.tenant_id },
      });
      if (!tenant || tenant.status !== "1") {
        await prisma.sys_login_log.create({
          data: {
            tenant_id: user.tenant_id,
            user_id: user.user_id,
            username,
            ip_address: ip,
            user_agent: userAgent,
            status: "0",
            message: "租户已禁用",
          },
        });
        throw new AppError(403, "租户已禁用", 403);
      }

      // 更新最后登录信息
      await prisma.sys_user.update({
        where: { user_id: user.user_id },
        data: {
          last_login_ip: ip,
          last_login_time: new Date(),
        },
      });

      // 记录登录成功日志
      await prisma.sys_login_log.create({
        data: {
          tenant_id: user.tenant_id,
          user_id: user.user_id,
          username,
          ip_address: ip,
          user_agent: userAgent,
          status: "1",
          message: "登录成功",
        },
      });

      const tokens = await this.generateTokens(user);
      success(
        res,
        {
          ...tokens,
          user: {
            userId: user.user_id,
            username: user.username,
            tenantId: user.tenant_id,
          },
        },
        "登录成功",
      );
    } catch (err) {
      // 注意：如果错误已经在上面记录了日志，这里不要再重复记录
      this.handleError(res, err);
    }
  }

  @Post("/refresh")
  @ApiOperation("刷新令牌")
  @ApiBody(RefreshTokenSchema)
  @ApiResponse(200, "刷新成功")
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const { refreshToken } = req.body;
      const { payload } = await jwtVerify(refreshToken, JWT_SECRET);
      const user = await prisma.sys_user.findUnique({
        where: { user_id: payload.userId as string },
      });
      if (!user || user.is_deleted !== 0)
        throw new AppError(401, "无效的刷新令牌", 401);

      const tokens = await this.generateTokens(user);
      success(res, tokens, "刷新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/profile")
  @ApiOperation("获取当前用户信息")
  @ApiResponse(200, "查询成功")
  async profile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError(401, "未认证或用户信息缺失", 401);
      }
      const user = await prisma.sys_user.findUnique({
        where: { user_id: userId },
        // @ts-ignore
        include: {
          sys_user_role: { include: { role: true } },
          sys_user_dept: { include: { dept: true } },
        },
      });
      if (!user) throw new AppError(404, "用户不存在", 404);
      success(res, {
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        tenantId: user.tenant_id,
        roles: (user.sys_user_role as any[]).map(
          (ur: any) => ur.sys_role?.role_code,
        ),
        depts: (user.sys_user_dept as any[]).map(
          (ud: any) => ud.sys_dept?.dept_name,
        ),
      });
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/password")
  @ApiOperation("修改密码")
  @ApiBody(ChangePasswordSchema)
  @ApiResponse(200, "修改成功")
  async changePassword(@Req() req: Request, @Res() res: Response) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?.userId;
      const user = await prisma.sys_user.findUnique({
        where: { user_id: userId },
      });
      if (!user) throw new AppError(404, "用户不存在", 404);

      const valid = await compare(oldPassword, user.password);
      if (!valid) throw new AppError(400, "原密码错误", 400);

      const hashed = await hash(newPassword, 10);
      await prisma.sys_user.update({
        where: { user_id: userId },
        data: { password: hashed, updated_at: new Date() },
      });
      success(res, null, "密码修改成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: any) {
    console.error(err, "err");
    if (err instanceof AppError) {
      error(res, err.message, err.statusCode);
    } else {
      error(res, "操作失败", 500);
    }
  }
  @Post("/profile")
  @ApiOperation("更新个人信息")
  @ApiBody(UpdateProfileSchema)
  @ApiResponse(200, "更新成功")
  async updateProfile(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = req.user!.userId;
      const dto = UpdateProfileSchema.parse(req.body);
      // 只更新允许的字段
      const allowed = {
        real_name: dto.realName,
        email: dto.email,
        phone: dto.phone,
        avatar: dto.avatar,
      };
      Object.keys(allowed).forEach(
        (key) => allowed[key] === undefined && delete allowed[key],
      );
      await prisma.sys_user.update({
        where: { user_id: userId },
        data: { ...allowed, updated_at: new Date() },
      });
      success(res, null, "个人信息更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  /**
   * 获取当前用户可访问的菜单树（目录和菜单，不含按钮）
   */
  @Get("/menus")
  @ApiOperation("获取当前用户菜单树", "返回当前用户可访问的菜单树")
  @ApiResponse(200, "查询成功")
  async getMyMenus(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      // 1. 获取用户角色
      const userRoles = await prisma.sys_user_role.findMany({
        where: { user_id: userId, tenant_id: tenantId },
        select: { role_id: true },
      });
      if (userRoles.length === 0) {
        return success(res, [], "查询成功");
      }
      const roleIds = userRoles.map((r) => r.role_id);

      // 2. 获取角色关联的菜单 ID
      const roleMenus = await prisma.sys_role_menu.findMany({
        where: { role_id: { in: roleIds }, tenant_id: tenantId },
        select: { menu_id: true },
      });
      if (roleMenus.length === 0) {
        return success(res, [], "查询成功");
      }
      const menuIds = [...new Set(roleMenus.map((rm) => rm.menu_id))];

      // 3. 查询菜单（类型为 1-目录，2-菜单），状态启用，未删除
      const menus = await prisma.sys_menu.findMany({
        where: {
          menu_id: { in: menuIds },
          tenant_id: tenantId,
          status: "1",
          is_deleted: 0,
          menu_type: { in: [1, 2] },
        },
        orderBy: { sort_order: "asc" },
      });

      // 4. 构建树
      const tree = this.buildMenuTree(menus, null);
      success(res, tree, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /**
   * 获取当前用户所有权限编码
   */
  @Get("/permissions")
  @ApiOperation("获取当前用户权限列表", "返回当前用户拥有的权限编码数组")
  @ApiResponse(200, "查询成功")
  async getMyPermissions(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user!;
      // 1. 用户角色
      const userRoles = await prisma.sys_user_role.findMany({
        where: { user_id: userId, tenant_id: tenantId },
        select: { role_id: true },
      });
      if (userRoles.length === 0) {
        return success(res, [], "查询成功");
      }
      const roleIds = userRoles.map((r) => r.role_id);

      // 2. 角色权限
      const rolePerms = await prisma.sys_role_permission.findMany({
        where: { role_id: { in: roleIds }, tenant_id: tenantId },
        select: { perm_id: true },
      });
      if (rolePerms.length === 0) {
        return success(res, [], "查询成功");
      }
      const permIds = [...new Set(rolePerms.map((rp) => rp.perm_id))];

      // 3. 查询权限编码
      const perms = await prisma.sys_permission.findMany({
        where: { perm_id: { in: permIds }, tenant_id: tenantId, status: "1" },
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
    const parent = parentId;
    return items
      .filter((item) => item.parent_id === parent)
      .map((item) => ({
        ...keysToCamelCase(item),
        children: this.buildMenuTree(items, item.menu_id),
      }));
  }
  @Post("/logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const userId = req.user?.userId;
    if (userId) {
      await redis.del(`access:${userId}`);
      await redis.del(`refresh:${userId}`);
    }
    success(res, null, "登出成功");
  }
  @Post("/register")
  @ApiOperation("用户注册", "在已有租户下注册新用户")
  @ApiBody(RegisterSchema)
  @ApiResponse(201, "注册成功")
  @ApiResponse(400, "参数错误")
  @ApiResponse(409, "用户名已存在")
  async register(@Req() req: Request, @Res() res: Response) {
    try {
      const { tenantCode, tenantName, username, password, email, phone } =
        RegisterSchema.parse(req.body);

      // 1. 检查租户编码是否已存在（全局唯一）
      const tenantExists =
        await this.userRepository.findTenantByCode(tenantCode);
      if (tenantExists) {
        throw new AppError(409, "租户编码已存在", 409);
      }

      // 2. 事务创建租户和用户
      const { tenant, user } = await this.userRepository.registerTenantWithUser(
        {
          tenantCode,
          tenantName,
          username,
          password,
          email,
          phone,
        },
      );

      // 3. 返回结果
      success(
        res,
        {
          tenantId: tenant.tenant_id,
          userId: user.user_id,
          username: user.username,
        },
        "注册成功",
        201,
      );
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
