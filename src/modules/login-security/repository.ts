import { prisma } from "@/config/database.js";
import { DETECT_CONFIG } from "./constants.js";
import type { HistoryLogin, LoginContext } from "./types.js";

export class LoginSecurityRepository {
  /**
   * 拉取用户最近 N 天的登录历史（成功登录）
   * 排除本次
   */
  async findHistory(
    userId: string,
    tenantId: string,
    excludeLogId?: string,
  ): Promise<HistoryLogin[]> {
    const since = new Date();
    since.setDate(since.getDate() - DETECT_CONFIG.HISTORY_DAYS);

    const rows = await prisma.sys_login_log.findMany({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        status: "1",
        created_at: { gte: since },
        ...(excludeLogId ? { log_id: { not: excludeLogId } } : {}),
      },
      orderBy: { created_at: "desc" },
      take: DETECT_CONFIG.HISTORY_MAX_ROWS,
      select: {
        log_id: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        country: true,
        province: true,
        city: true,
      },
    });

    return rows.map((r) => ({
      logId: r.log_id,
      ip: r.ip_address,
      userAgent: r.user_agent,
      createdAt: r.created_at,
      country: r.country,
      province: r.province,
      city: r.city,
    }));
  }

  /**
   * 回写检测结果
   */
  async updateAbnormalResult(
    logId: string,
    result: {
      isAbnormal: boolean;
      reason?: string;
      type?: string;
      country?: string;
      province?: string;
      city?: string;
      isp?: string;
    },
  ): Promise<void> {
    await prisma.sys_login_log.update({
      where: { log_id: logId },
      data: {
        is_abnormal: result.isAbnormal ? 1 : 0,
        abnormal_reason: result.reason ?? null,
        abnormal_type: result.type ?? null,
        country: result.country ?? null,
        province: result.province ?? null,
        city: result.city ?? null,
        isp: result.isp ?? null,
      },
    });
  }

  async updateNotifyStatus(logId: string, status: number): Promise<void> {
    await prisma.sys_login_log.update({
      where: { log_id: logId },
      data: { notify_status: status },
    });
  }

  /**
   * 用户侧：分页查询自己的登录记录
   */
  async findMyLoginLogs(
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
    const { pageNum, pageSize, onlyAbnormal, startTime, endTime } = options;
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, user_id: userId };
    if (onlyAbnormal) where.is_abnormal = 1;
    if (startTime || endTime) {
      where.created_at = {
        ...(startTime ? { gte: startTime } : {}),
        ...(endTime ? { lte: endTime } : {}),
      };
    }

    const [list, total] = await Promise.all([
      prisma.sys_login_log.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.sys_login_log.count({ where }),
    ]);

    return { list, total, pageNum, pageSize };
  }

  /**
   * 管理侧：查询租户所有异常登录
   */
  async findAbnormalLogs(
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
    const { pageNum, pageSize, userId, abnormalType, startTime, endTime } =
      options;
    const skip = (pageNum - 1) * pageSize;

    const where: any = { tenant_id: tenantId, is_abnormal: 1 };
    if (userId) where.user_id = userId;
    if (abnormalType) where.abnormal_type = abnormalType;
    if (startTime || endTime) {
      where.created_at = {
        ...(startTime ? { gte: startTime } : {}),
        ...(endTime ? { lte: endTime } : {}),
      };
    }

    const [list, total] = await Promise.all([
      prisma.sys_login_log.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.sys_login_log.count({ where }),
    ]);

    return { list, total, pageNum, pageSize };
  }

  /**
   * 按异常类型聚合（用于统计面板）
   */
  async aggregateByType(
    tenantId: string,
    since: Date,
  ): Promise<Array<{ abnormal_type: string; count: number }>> {
    const rows = await prisma.sys_login_log.groupBy({
      by: ["abnormal_type"],
      where: {
        tenant_id: tenantId,
        is_abnormal: 1,
        created_at: { gte: since },
      },
      _count: { log_id: true },
    });
    return rows
      .filter((r) => r.abnormal_type)
      .map((r) => ({
        abnormal_type: r.abnormal_type as string,
        count: r._count.log_id,
      }));
  }
}
