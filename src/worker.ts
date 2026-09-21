import { startMergeWorker, installWorkerShutdown } from "@/bootstrap/index.js";
import { logger } from "@/platform/logger/index.js";

const worker = startMergeWorker();
installWorkerShutdown(worker);

logger.info("[worker] merge worker started");
