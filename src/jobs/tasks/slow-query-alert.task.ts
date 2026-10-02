import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";
import { SlowQueryRepository } from "@/modules/monitor/slow-query/index.js";
import {
  ALERT_MEAN_MS,
  ALERT_CALLS_GROWTH,
} from "@/modules/monitor/slow-query/constants.js";

const repo = new SlowQueryRepository();

/**
 * 扫描 24h 内 mean_time 超阈值的慢查询并发告警
 */
export async function runSlowQueryAlertTask(): Promise<string> {
  const rows = await repo.findForAlert(ALERT_MEAN_MS, ALERT_CALLS_GROWTH, 20);
  if (rows.length === 0) return "无告警";

  await sendAlert({
    level: "warning",
    title: "slow_query_review",
    message: `发现 ${rows.length} 条慢查询超阈值（mean ≥ ${ALERT_MEAN_MS}ms 且 calls ≥ ${ALERT_CALLS_GROWTH}）`,
    source: "database",
    data: {
      top: rows.slice(0, 5).map((r) => ({
        fingerprint: r.fingerprint,
        sample: r.query_sample.slice(0, 300),
        meanTimeMs: r.mean_time_ms,
        calls: r.calls,
        totalTimeMs: r.total_time_ms,
      })),
    },
  });

  logger.info({ count: rows.length }, "[slow-query] alert sent");
  return `告警 ${rows.length} 条`;
}
