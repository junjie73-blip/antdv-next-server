import { startAllWorkers, installWorkerShutdown } from "@/bootstrap/index.js";
import { logger } from "@/platform/logger/index.js";

/**
 * Worker 进程入口
 * - 启动所有队列的 Worker：merge / report-export / wf-notify / cache-warm
 * - 统一优雅退出
 */
const bundle = startAllWorkers();
installWorkerShutdown(bundle.all);

logger.info(
  { queues: bundle.all.map((w) => w.name) },
  "[worker] process ready",
);
