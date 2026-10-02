import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "@/platform/logger/index.js";

const execAsync = promisify(exec);

/**
 * 每月更新 GeoIP 数据（geoip-lite-update）
 * 仅在有写入权限时执行；失败不告警
 */
export async function runGeoipUpdateTask(): Promise<void> {
  try {
    await execAsync("pnpm dlx geoip-lite-update", { timeout: 300_000 });
    logger.info("[geoip] data updated");
  } catch (err) {
    logger.warn({ err }, "[geoip] update failed");
  }
}
