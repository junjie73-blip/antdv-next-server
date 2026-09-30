import { compare } from "bcryptjs";
import { UserRepository } from "../repository/user.repository.js";
import { RoleRepository } from "../repository/role.repository.js";
import { issueTokens, verifyRefreshToken } from "./token.service.js";
import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export interface LoginInput {
  tenantId: string;
  username: string;
  password: string;
  deviceId?: string;
  clientIp?: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: {
    userId: string;
    username: string;
    tenantId: string;
    roles: string[];
  };
}

export class AuthService {
  private userRepo = new UserRepository();
  private roleRepo = new RoleRepository();

  async login(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepo.findByUsername(
      input.tenantId,
      input.username,
    );
    if (!user) throw new Error("用户名或密码错误");

    const ok = await compare(input.password, user.password);
    if (!ok) throw new Error("用户名或密码错误");

    if (user.status !== "1") throw new Error("账号已被禁用");
    if (user.is_deleted !== 0) throw new Error("账号已删除");

    // 自动撤销注销申请
    if (user.cancelled_at) {
      logger.info({ userId: user.user_id }, "[auth] revoke cancel account");
    }

    await this.userRepo.updateLastLogin(user.user_id, input.clientIp ?? "");

    const roles = await this.roleRepo.findUserRoleCodes(
      user.user_id,
      input.tenantId,
    );

    const tokens = await issueTokens({
      userId: user.user_id,
      tenantId: input.tenantId,
      username: user.username,
      roles,
      deviceId: input.deviceId,
    });

    return {
      ...tokens,
      user: {
        userId: user.user_id,
        username: user.username,
        tenantId: input.tenantId,
        roles,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    deviceId: string;
  }> {
    const payload = await verifyRefreshToken(refreshToken);
    const { userId, tenantId, deviceId } = payload;
    if (!userId || !tenantId || !deviceId) {
      throw new Error("无效的刷新令牌");
    }

    const stored = await redis.get(`refresh:${tenantId}:${userId}:${deviceId}`);
    if (!stored || stored !== refreshToken) {
      throw new Error("刷新令牌已失效");
    }

    const user = await this.userRepo.findById(userId, tenantId);
    if (!user) throw new Error("用户不存在");

    const roles = await this.roleRepo.findUserRoleCodes(userId, tenantId);

    // 轮换：先删旧 session
    await Promise.all([
      redis.del(`access:${tenantId}:${userId}:${deviceId}`),
      redis.del(`refresh:${tenantId}:${userId}:${deviceId}`),
    ]);

    return issueTokens({
      userId,
      tenantId,
      username: user.username,
      roles,
      deviceId,
    });
  }
}

void env; // 保留以备后用
