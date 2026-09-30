import { compare } from "bcryptjs";
import { prisma } from "@/config/database.js";
import { AppError, NotFoundError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { revokeAllSessions } from "./token.service.js";

const CANCEL_BUFFER_DAYS = 7;
const CANCEL_BUFFER_MS = CANCEL_BUFFER_DAYS * 24 * 60 * 60 * 1000;

export interface CancelAccountContext {
  userId: string;
  tenantId: string;
  username: string;
  password: string;
  reason?: string;
  clientIp: string;
  userAgent: string;
}

export class CancelAccountService {
  /**
   * 提交注销申请
   */
  async submit(input: CancelAccountContext): Promise<{
    cancelledAt: Date;
    effectiveAt: Date;
    bufferDays: number;
  }> {
    const user = await prisma.sys_user.findFirst({
      where: {
        user_id: input.userId,
        tenant_id: input.tenantId,
        is_deleted: 0,
      },
      select: {
        user_id: true,
        password: true,
        status: true,
        cancelled_at: true,
      },
    });
    if (!user) throw new NotFoundError("用户不存在");
    if (user.status !== "1") throw new AppError("账号已被禁用", 403001, 403);
    if (user.cancelled_at)
      throw new AppError("已有注销申请，无需重复提交", 400001, 400);

    // 密码二次确认
    if (!(await compare(input.password, user.password))) {
      throw new AppError("密码错误", 400001, 400);
    }

    const cancelledAt = new Date();
    const effectiveAt = new Date(cancelledAt.getTime() + CANCEL_BUFFER_MS);

    await prisma.sys_user.update({
      where: { user_id: input.userId },
      data: {
        cancelled_at: cancelledAt,
        cancel_reason: input.reason ?? null,
        cancel_effective: effectiveAt,
        updated_at: cancelledAt,
      },
    });

    // 立即失效所有会话，强制用户下线
    await revokeAllSessions(input.userId);

    // 写登录日志（标记为"注销申请"）
    await prisma.sys_login_log.create({
      data: {
        tenant_id: input.tenantId,
        user_id: input.userId,
        username: input.username,
        ip_address: input.clientIp,
        user_agent: input.userAgent,
        status: "1",
        message: `提交账号注销申请，将于 ${CANCEL_BUFFER_DAYS} 天后生效`,
      },
    });

    logger.info(
      {
        userId: input.userId,
        tenantId: input.tenantId,
        effectiveAt,
        reason: input.reason,
      },
      "[auth] cancel account submitted",
    );

    return {
      cancelledAt,
      effectiveAt,
      bufferDays: CANCEL_BUFFER_DAYS,
    };
  }

  /**
   * 查询当前用户的注销状态
   */
  async getStatus(userId: string, tenantId: string) {
    const user = await prisma.sys_user.findFirst({
      where: { user_id: userId, tenant_id: tenantId, is_deleted: 0 },
      select: {
        cancelled_at: true,
        cancel_reason: true,
        cancel_effective: true,
      },
    });
    if (!user) throw new NotFoundError("用户不存在");

    if (!user.cancelled_at) {
      return { pending: false };
    }

    const remainingMs = (user.cancel_effective?.getTime() ?? 0) - Date.now();
    const remainingDays = Math.max(0, Math.ceil(remainingMs / 86400000));

    return {
      pending: true,
      cancelledAt: user.cancelled_at,
      effectiveAt: user.cancel_effective,
      reason: user.cancel_reason,
      remainingDays,
    };
  }

  /**
   * 定时清理：软删除到期注销的账号
   */
  async cleanExpired(): Promise<number> {
    const count = await prisma.$transaction(async (tx) => {
      // 1. 查出即将被清理的用户
      const users = await tx.sys_user.findMany({
        where: {
          cancelled_at: { not: null },
          cancel_effective: { lte: new Date() },
          is_deleted: 0,
        },
        select: { user_id: true, tenant_id: true, username: true },
        take: 500,
      });

      if (users.length === 0) return 0;

      // 2. 软删除
      const result = await tx.sys_user.updateMany({
        where: { user_id: { in: users.map((u) => u.user_id) } },
        data: { is_deleted: 1, updated_at: new Date() },
      });

      // 3. 写审计日志
      await tx.sys_audit_log.createMany({
        data: users.map((u) => ({
          tenant_id: u.tenant_id,
          user_id: u.user_id,
          username: u.username,
          operation: "账号注销生效",
          method: "SYSTEM",
          request_url: "/system/job/cancel-account-clean",
          ip_address: "127.0.0.1",
          status: "1",
          created_at: new Date(),
        })),
      });

      return result.count;
    });

    if (count > 0) {
      logger.info({ count }, "[auth] cancel account cleaned");
    }
    return count;
  }
}
