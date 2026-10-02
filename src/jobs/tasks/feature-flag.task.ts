import { logger } from "@/platform/logger/index.js";
import { sendAlert } from "@/platform/alert/index.js";
import { featureFlagService } from "@/modules/system/feature-flag/singleton.js";

export async function remindExpiringFlags(): Promise<void> {
  const expiring = await featureFlagService.listExpiring(7);
  if (expiring.length === 0) return;

  await sendAlert({
    level: "warning",
    title: "feature_flag_expiring",
    message: `${expiring.length} 个特性开关将在 7 天内过期`,
    source: "feature-flag",
    data: expiring.map((f) => ({
      flagKey: f.flag_key,
      expireAt: f.expire_at?.toISOString(),
      owner: f.owner,
    })),
  });
  logger.info(
    { count: expiring.length },
    "[feature-flag] expiring reminder sent",
  );
}
