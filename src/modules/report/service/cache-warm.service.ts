import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";
import { ReportCache } from "./report-cache.js";
import { reportEngine } from "./engine.js";

export interface WarmTask {
  reportCode: string;
  tenantId: string;
  userId: string;
  username: string;
  params: Record<string, any>;
}

export interface WarmResult {
  reportCode: string;
  tenantId: string;
  status: "success" | "failed";
  duration: number;
  rowCount: number;
  error?: string;
  reportName?: string;
}

export class CacheWarmService {
  /* ============================================================
   * 标记报表需要预热
   * ============================================================ */
  async markForWarm(
    reportCode: string,
    tenantId: string,
    options: {
      params?: Record<string, any>;
      cacheTtl?: number;
      cronExpression?: string;
      userId?: string;
    } = {},
  ): Promise<void> {
    const existing = await prisma.rp_cache_warm_config.findFirst({
      where: { tenant_id: tenantId, report_code: reportCode, is_deleted: 0 },
    });

    if (existing) {
      await prisma.rp_cache_warm_config.update({
        where: { config_id: existing.config_id },
        data: {
          warm_params: (options.params ?? null) as any,
          cache_ttl: options.cacheTtl ?? existing.cache_ttl,
          cron_expression: options.cronExpression ?? existing.cron_expression,
          enabled: 1,
          updated_by: options.userId,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.rp_cache_warm_config.create({
        data: {
          tenant_id: tenantId,
          report_code: reportCode,
          warm_params: (options.params ?? null) as any,
          cache_ttl: options.cacheTtl ?? 1800,
          cron_expression: options.cronExpression ?? "0 */30 * * * ?",
          enabled: 1,
          created_by: options.userId,
          updated_by: options.userId,
        },
      });
    }

    logger.info({ reportCode, tenantId }, "[cache-warm] 已标记");
  }

  /**
   * 取消预热
   */
  async unmark(reportCode: string, tenantId: string): Promise<void> {
    await prisma.rp_cache_warm_config.updateMany({
      where: { tenant_id: tenantId, report_code: reportCode, is_deleted: 0 },
      data: { enabled: 0, updated_at: new Date() },
    });
    logger.info({ reportCode, tenantId }, "[cache-warm] 已取消");
  }

  /**
   * 列出待预热配置
   */
  async listConfigs(tenantId?: string) {
    return prisma.rp_cache_warm_config.findMany({
      where: {
        ...(tenantId ? { tenant_id: tenantId } : {}),
        enabled: 1,
        is_deleted: 0,
      },
      orderBy: { last_warm_at: "asc" },
    });
  }

  /* ============================================================
   * 执行单个报表的预热
   * ============================================================ */
  async warmOne(task: WarmTask, cacheTtl = 1800): Promise<WarmResult> {
    const start = Date.now();
    try {
      const result = await reportEngine.execute({
        reportCode: task.reportCode,
        tenantId: task.tenantId,
        userId: task.userId,
        username: task.username,
        input: task.params,
        useCache: false, // 强制走数据库，避免读取旧缓存
      });

      // 主动写入缓存
      if (result.total <= 10_000) {
        const cacheKey = ReportCache.buildKey(
          task.tenantId,
          task.reportCode,
          task.params,
        );
        await ReportCache.set(cacheKey, result, cacheTtl);
      }

      const duration = Date.now() - start;

      // 更新预热记录
      await prisma.rp_cache_warm_config.updateMany({
        where: {
          tenant_id: task.tenantId,
          report_code: task.reportCode,
          is_deleted: 0,
        },
        data: {
          last_warm_at: new Date(),
          last_status: "1",
          last_error: null,
        },
      });

      logger.info(
        {
          reportCode: task.reportCode,
          tenantId: task.tenantId,
          duration,
          rowCount: result.total,
        },
        "[cache-warm] 预热成功",
      );

      return {
        reportCode: task.reportCode,
        tenantId: task.tenantId,
        status: "success",
        duration,
        rowCount: result.total,
      };
    } catch (err: any) {
      const duration = Date.now() - start;

      await prisma.rp_cache_warm_config
        .updateMany({
          where: {
            tenant_id: task.tenantId,
            report_code: task.reportCode,
            is_deleted: 0,
          },
          data: {
            last_warm_at: new Date(),
            last_status: "0",
            last_error: err.message,
          },
        })
        .catch(() => undefined);

      logger.warn(
        { err, reportCode: task.reportCode, tenantId: task.tenantId },
        "[cache-warm] 预热失败",
      );

      return {
        reportCode: task.reportCode,
        tenantId: task.tenantId,
        status: "failed",
        duration,
        rowCount: 0,
        error: err.message,
      };
    }
  }

  /* ============================================================
   * 批量预热某个租户的所有配置
   * ============================================================ */
  async warmTenant(
    tenantId: string,
    systemUserId: string,
  ): Promise<WarmResult[]> {
    const configs = await prisma.rp_cache_warm_config.findMany({
      where: { tenant_id: tenantId, enabled: 1, is_deleted: 0 },
    });

    if (configs.length === 0) return [];

    logger.info(
      { tenantId, count: configs.length },
      "[cache-warm] 开始批量预热",
    );

    const results: WarmResult[] = [];

    for (const config of configs) {
      const params = (config.warm_params as Record<string, any>) ?? {};
      const result = await this.warmOne(
        {
          reportCode: config.report_code,
          tenantId,
          userId: systemUserId,
          username: "system",
          params,
        },
        config.cache_ttl,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 全局预热（所有租户）
   */
  async warmAll(systemUserId: string): Promise<WarmResult[]> {
    const tenants = await prisma.sys_tenant.findMany({
      where: { status: "1", is_deleted: 0 },
      select: { tenant_id: true },
    });

    const allResults: WarmResult[] = [];
    for (const t of tenants) {
      const results = await this.warmTenant(t.tenant_id, systemUserId);
      allResults.push(...results);
    }
    return allResults;
  }

  /**
   * 手动触发某个报表预热
   */
  async warmByCode(
    reportCode: string,
    tenantId: string,
    userId: string,
  ): Promise<WarmResult> {
    const config = await prisma.rp_cache_warm_config.findFirst({
      where: { tenant_id: tenantId, report_code: reportCode, is_deleted: 0 },
    });

    const params = (config?.warm_params as Record<string, any>) ?? {};
    return this.warmOne(
      {
        reportCode,
        tenantId,
        userId,
        username: "system",
        params,
      },
      config?.cache_ttl ?? 1800,
    );
  }
}

export const cacheWarmService = new CacheWarmService();
