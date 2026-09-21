import { EventEmitter } from "node:events";
import { logger } from "@/platform/logger/index.js";

export function watchListenerLeak(
  emitter: EventEmitter,
  name: string,
  threshold = 50,
) {
  const orig = emitter.on.bind(emitter);
  emitter.on = ((event: string, listener: (...args: any[]) => void) => {
    const count = emitter.listenerCount(event);
    if (count >= threshold) {
      logger.warn(
        { emitter: name, event, count },
        "listener count high, possible leak",
      );
    }
    return orig(event, listener);
  }) as any;
}

const timers = new Set<NodeJS.Timeout>();
const origSetInterval = global.setInterval;
const origClearInterval = global.clearInterval;

export function trackTimers() {
  (global as any).setInterval = (...args: any[]) => {
    const t = (origSetInterval as any)(...args);
    timers.add(t);
    return t;
  };
  (global as any).clearInterval = (t: NodeJS.Timeout) => {
    timers.delete(t);
    return origClearInterval(t);
  };
}

export function snapshotTimers() {
  return { count: timers.size };
}

export function clearAllTimers() {
  for (const t of timers) clearInterval(t);
  timers.clear();
}
