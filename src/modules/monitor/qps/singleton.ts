import { QpsMonitorService } from "./service.js";
import { logger } from "@/platform/logger/index.js";

export const qpsMonitor = new QpsMonitorService();

const sampler = setInterval(() => {
  try {
    qpsMonitor.sample();
  } catch (e) {
    logger.warn({ err: e }, "[qps] sample failed");
  }
}, 1000);
sampler.unref();

export function stopQpsSampler(): void {
  clearInterval(sampler);
}
