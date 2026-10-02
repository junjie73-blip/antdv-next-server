import { wfTimeoutService } from "@/modules/workflow/service/timeout.service.js";
import { logger } from "@/platform/logger/index.js";

export async function workflowTimeoutTask(): Promise<void> {
  const start = Date.now();
  const result = await wfTimeoutService.scanAndEscalate();
  logger.info({ ...result, duration: Date.now() - start }, "[wf-timeout] done");
}
