import { logger } from "@/platform/logger/index.js";
import { ServerRepository } from "./repository.js";

const repo = new ServerRepository();
let timer: NodeJS.Timeout | null = null;

export function startServerSampler(): void {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      await repo.info(); // info() 内会 push 一条采样
    } catch (e) {
      logger.warn({ e }, "[server-sampler] sample failed");
    }
  }, 30_000);
  timer.unref();
}

export function stopServerSampler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
