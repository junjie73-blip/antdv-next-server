import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";
import { DatabaseMonitorService } from "@/modules/monitor/database/service.js";

const MEAN_TIME_ALERT_MS = 1000;
const TOTAL_TIME_ALERT_MS = 60_000;

/**
 * 每日巡检：从 pg_stat_statements 拉 Top 20 慢查询
 *  - 均值 > 1s → 告警
 *  - 累计 > 60s → 告警
 */
export async function runDbSlowQueryReviewTask(): Promise<string> {
  const service = new DatabaseMonitorService();
  const top = await service.getSlowQueries(20);

  if (top.length === 0) {
    logger.info("[slow-query-review] pg_stat_statements 无数据");
    return "无慢查询数据";
  }

  const criticalByMean = top.filter((q) => q.meanTime > MEAN_TIME_ALERT_MS);
  const criticalByTotal = top.filter((q) => q.totalTime > TOTAL_TIME_ALERT_MS);

  if (criticalByMean.length > 0 || criticalByTotal.length > 0) {
    await sendAlert({
      level: "warning",
      title: "slow_query_review",
      message: `慢查询巡检：${criticalByMean.length} 条均值超标，${criticalByTotal.length} 条累计超标`,
      source: "database",
      data: {
        topByMean: criticalByMean.slice(0, 5).map((q) => ({
          query: q.query.slice(0, 200),
          meanTime: q.meanTime,
          calls: q.calls,
        })),
        topByTotal: criticalByTotal.slice(0, 5).map((q) => ({
          query: q.query.slice(0, 200),
          totalTime: q.totalTime,
        })),
      },
    });
  }

  logger.info(
    {
      total: top.length,
      criticalByMean: criticalByMean.length,
      criticalByTotal: criticalByTotal.length,
    },
    "[slow-query-review] done",
  );
  return `巡检 ${top.length} 条慢查询`;
}
