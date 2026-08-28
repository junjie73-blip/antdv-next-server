import {
  Controller,
  Post,
  Get,
  Put,
  Tag,
  Summary,
  Body,
  Response as ApiResponse,
  Middleware,
} from "@common/core/decorators.js";
import { z } from "zod";
import { prisma } from "@config/database.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@common/security/jwt.js";
import { MfaService } from "@common/security/mfa.js";
import { env } from "@config/env.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  RegisterBody,
  LoginBody,
  RefreshBody,
  ChangePasswordBody,
  LogoutBody,
} from "./schema.js";
import { error, success } from "@common/utils/response.js";
import { initTenantRbac } from "@common/rbac/init.js";
import { authMiddleware } from "@common/middleware/auth.js";

@Controller("/auth")
export default class AuthController {
  @Tag("认证")
  @Summary("用户注册")
  @Body(RegisterBody)
  @ApiResponse(
    201,
    z.object({
      success: z.boolean(),
      data: z.object({ id: z.string(), username: z.string() }),
    }),
    "注册成功",
  )
  @Post("/register")
  async register(req: any, res: any) {
    const { username, password, nickname, email, phone, name, tenantId } =
      req.body;

    // 检查账号是否已存在
    const exists = await prisma.user.findFirst({
      where: { username, tenantId, deletedAt: null },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: "账号已被注册" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        nickname: nickname || name || username,
        email,
        phone,
        name,
        tenantId,
      },
    });

    await initTenantRbac(tenantId);

    const ownerRole = await prisma.role.findFirst({
      where: { tenantId, code: "OWNER", deletedAt: null } as any,
    });
    if (ownerRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: ownerRole.id },
      });
    }

    res
      .status(201)
      .json(success({ id: user.id, username: user.username }, "注册成功", 201));
  }

  @Tag("认证")
  @Summary("用户登录（账号+密码）")
  @Body(LoginBody)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({
        accessToken: z.string(),
        refreshToken: z.string(),
        mfaRequired: z.boolean(),
        user: z.object({
          id: z.string(),
          username: z.string(),
          nickname: z.string().nullable(),
          avatar: z.string().nullable(),
          role: z.string().nullable(),
        }),
      }),
    }),
    "登录成功",
  )
  @Post("/login")
  async login(req: any, res: any) {
    const { username, password, tenantId, mfaCode } = req.body;

    const where: any = { username, deletedAt: null };
    if (tenantId) where.tenantId = tenantId;

    const users = await prisma.user.findMany({ where, take: 2 });

    if (users.length === 0) {
      return res.status(401).json(error(null, "账号或密码错误", 401));
    }
    if (users.length > 1 && !tenantId) {
      return res.status(400).json({
        success: false,
        message: "该账号关联多个租户，请提供 tenantId",
        requireTenantId: true,
      });
    }

    const user = users[0];
    if (!user?.passwordHash) {
      return res.status(401).json(error(null, "账号或密码错误", 401));
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json(error(null, "账号或密码错误", 401));
    }

    // MFA 校验
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return res.json(
          success(
            {
              mfaRequired: true,
              accessToken: null,
              refreshToken: null,
              user: null,
            },
            "MFA 校验 required",
          ),
        );
      }
      const ok = MfaService.verifyToken(user.mfaSecret!, mfaCode);
      if (!ok) {
        return res.status(401).json(error(null, "MFA 验证码错误", 401));
      }
    }

    const jti = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
      }),
      signRefreshToken({ sub: user.id, jti }),
    ]);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json(
      success(
        {
          accessToken,
          refreshToken,
          mfaRequired: false,
          user: {
            id: user.id,
            username: user.username,
            nickname: user.nickname,
            avatar: user.avatar,
            role: user.role,
          },
        },
        "登录成功",
      ),
    );
  }

  @Tag("认证")
  @Summary("刷新令牌")
  @Body(RefreshBody)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({ accessToken: z.string(), refreshToken: z.string() }),
    }),
    "刷新成功",
  )
  @Post("/refresh")
  async refresh(req: any, res: any) {
    const { refreshToken } = req.body;
    try {
      const payload = await verifyRefreshToken(refreshToken);
      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!stored || stored.expiresAt < new Date()) {
        return res.status(401).json(error(null, "刷新令牌无效", 401));
      }

      await prisma.refreshToken.delete({ where: { id: stored.id } });

      const jti = randomUUID();
      const [newAccess, newRefresh] = await Promise.all([
        signAccessToken({
          sub: stored.user.id,
          tenantId: stored.user.tenantId,
          role: stored.user.role,
        }),
        signRefreshToken({ sub: stored.user.id, jti }),
      ]);

      await prisma.refreshToken.create({
        data: {
          token: newRefresh,
          userId: stored.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      res.json(
        success(
          { accessToken: newAccess, refreshToken: newRefresh },
          "刷新成功",
        ),
      );
    } catch {
      res.status(401).json(error(null, "刷新令牌无效", 401));
    }
  }

  @Tag("认证")
  @Summary("用户登出")
  @Middleware(authMiddleware)
  @Body(LogoutBody)
  @Post("/logout")
  async logout(req: any, res: any) {
    const { refreshToken } = req.body || {};
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: "登出成功" });
  }

  @Tag("认证")
  @Summary("获取当前登录用户信息")
  @Middleware(authMiddleware)
  @Get("/me")
  async getMe(req: any, res: any) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "用户不存在" });
    }
    const { passwordHash, mfaSecret, ...rest } = user;
    res.json({ success: true, data: rest });
  }

  @Tag("认证")
  @Summary("修改当前用户密码")
  @Middleware(authMiddleware)
  @Body(ChangePasswordBody)
  @Put("/password")
  async changePassword(req: any, res: any) {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.passwordHash) {
      return res.status(400).json({ success: false, message: "用户无效" });
    }
    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "原密码错误" });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });
    res.json({ success: true, message: "密码修改成功" });
  }

  @Tag("认证")
  @Summary("启用 MFA")
  @Middleware(authMiddleware)
  @ApiResponse(
    200,
    z.object({
      success: z.boolean(),
      data: z.object({ secret: z.string(), qrCode: z.string() }),
    }),
    "启用成功",
  )
  @Post("/mfa/setup")
  async setupMfa(req: any, res: any) {
    const userId = req.user.id;
    const secret = MfaService.generateSecret();
    const qrCode = MfaService.generateQrCodeUrl(
      secret,
      req.user.username || req.user.email,
      env.MFA_ISSUER,
    );
    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });
    res.json(success({ secret, qrCode }, "启用成功"));
  }
}
