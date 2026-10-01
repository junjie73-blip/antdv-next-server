import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { cacheWarmService } from "@/modules/report/service/cache-warm.service.js";
import {
  rpCacheWarmTotal,
  rpCacheWarmDuration,
} from "@/platform/metrics/report.js";
import { reportNotifyService } from "@/modules/report/service/notify.service.js";

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";

/**
 * 报表缓存预热任务
 * - 每 30 分钟执行一次
 * - 遍历所有启用的预热配置
 * - 更新缓存
 */
export async function reportCacheWarmTask(): Promise<void> {
  const start = Date.now();

  try {
    // 1. 查找到期需要预热的配置（last_warm_at 早于 TTL）
    const now = Date.now();
    const configs = await prisma.rp_cache_warm_config.findMany({
      where: {
        enabled: 1,
        is_deleted: 0,
        OR: [
          { last_warm_at: null },
          {
            last_warm_at: {
              lte: new Date(now - 30 * 60 * 1000), // 上次预热超过 30 分钟
            },
          },
        ],
      },
      take: 100,
      orderBy: { last_warm_at: "asc" },
    });

    if (configs.length === 0) {
      logger.debug("[cache-warm] 无待预热配置");
      return;
    }

    logger.info({ count: configs.length }, "[cache-warm] 开始预热");

    let success = 0;
    let failed = 0;

    for (const config of configs) {
      const params = (config.warm_params as Record<string, any>) ?? {};
      const result = await cacheWarmService.warmOne(
        {
          reportCode: config.report_code,
          tenantId: config.tenant_id,
          userId: SYSTEM_USER_ID,
          username: "system",
          params,
        },
        config.cache_ttl,
      );

      // 埋点
      rpCacheWarmTotal
        .labels(config.tenant_id, config.report_code, result.status)
        .inc();
      rpCacheWarmDuration
        .labels(config.report_code)
        .observe(result.duration / 1000);

      if (result.status === "success") success++;
      else failed++;

      if (result.status === "failed") {
        // 查管理员
        const admins = await prisma.sys_user_role.findMany({
          where: {
            tenant_id: config.tenant_id,
            role: {
              role_code: { in: ["SUPER_ADMIN", "ADMIN"] },
              is_deleted: 0,
            },
          },
          select: { user_id: true },
          take: 5,
        });

        if (admins.length > 0) {
          await reportNotifyService
            .notifyWarmFailed({
              tenantId: config.tenant_id,
              reportCode: config.report_code,
              reportName: result.report_name,
              error: result.error ?? "未知错误",
              adminUserIds: admins.map((a) => a.user_id),
            })
            .catch(() => undefined);
        }
      }
    }

    const duration = Date.now() - start;
    logger.info(
      { total: configs.length, success, failed, duration },
      "[cache-warm] 批量预热完成",
    );
  } catch (err: any) {
    logger.error({ err }, "[cache-warm] 任务执行失败");
    throw err;
  }
}
