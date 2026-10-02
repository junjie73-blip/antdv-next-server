import { BaseService } from "@/core/base/service.js";
import { LoginSecurityRepository } from "../repository.js";
import { loginDetector } from "./detector.service.js";
import { loginSecurityNotification } from "./notification.service.js";
import { logger } from "@/platform/logger/index.js";
import type { LoginContext } from "../types.js";

/**
 * 登录安全服务
 * - 对外统一入口
 * - 在 auth.service 登录成功后调用 handleLoginSuccess
 */
export class LoginSecurityService extends BaseService<any> {
  constructor(repo: LoginSecurityRepository) {
    super(repo);
  }

  /**
   * 登录成功后处理（异步、fail-soft）
   * ⚠️ 必须由调用方 setImmediate 异步执行，不阻塞登录响应
   */
  async handleLoginSuccess(ctx: LoginContext): Promise<void> {
    try {
      // 1. 检测 + 回写
      const result = await loginDetector.detectAndPersist(ctx);

      if (!result.isAbnormal) return;

      // 2. 通知
      await loginSecurityNotification.notifyAbnormal(ctx, result);

      // 3. 回写通知状态
      if (ctx.logId) {
        await this.repository.updateNotifyStatus(ctx.logId, 1);
      }
    } catch (err) {
      logger.error(
        { err, userId: ctx.userId, ip: ctx.ip },
        "[login-security] handle failed",
      );
      // 不抛出：登录已成功，检测失败不应影响用户
    }
  }

  /* ============================================================
   * 用户侧
   * ============================================================ */
  async listMyLoginLogs(
    userId: string,
    tenantId: string,
    options: {
      pageNum: number;
      pageSize: number;
      onlyAbnormal?: boolean;
      startTime?: Date;
      endTime?: Date;
    },
  ) {
    return this.repository.findMyLoginLogs(userId, tenantId, options);
  }

  /* ============================================================
   * 管理侧
   * ============================================================ */
  async listAbnormalLogs(
    tenantId: string,
    options: {
      pageNum: number;
      pageSize: number;
      userId?: string;
      abnormalType?: string;
      startTime?: Date;
      endTime?: Date;
    },
  ) {
    return this.repository.findAbnormalLogs(tenantId, options);
  }

  async stats(tenantId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.repository.aggregateByType(tenantId, since);
    return {
      days,
      total: rows.reduce((s, r) => s + r.count, 0),
      byType: rows,
    };
  }
}
