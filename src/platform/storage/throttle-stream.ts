import { Transform, type TransformCallback } from "node:stream";
import { setTimeout as delay } from "node:timers/promises";

export interface ThrottleOptions {
  /** 每秒允许的字节数（0 = 不限速） */
  bytesPerSecond: number;
  /** 桶容量（默认 = 1 秒的量） */
  burstSize?: number;
}

/**
 * 令牌桶节流流
 * - 用于从对象存储下载时的速率控制
 * - bytesPerSecond = 0 → 直通
 */
export class ThrottleStream extends Transform {
  private readonly bps: number;
  private readonly burst: number;
  private tokens: number;
  private lastRefill: number;
  /** 防止并行 write 导致超发 */
  private pending: Promise<void> = Promise.resolve();

  constructor(opts: ThrottleOptions) {
    super({ highWaterMark: 64 * 1024 });
    this.bps = Math.max(0, opts.bytesPerSecond);
    this.burst = opts.burstSize ?? this.bps;
    this.tokens = this.burst;
    this.lastRefill = Date.now();
  }

  override _transform(chunk: Buffer, _enc: BufferEncoding, cb: TransformCallback): void {
    // 不限速
    if (this.bps <= 0) {
      this.push(chunk);
      return cb();
    }

    // 串行化处理，避免并行超发
    this.pending = this.pending.then(async () => {
      try {
        let remaining = chunk.length;

        while (remaining > 0) {
          this.refill();

          if (this.tokens >= remaining) {
            this.tokens -= remaining;
            remaining = 0;
          } else {
            // 令牌不足：等下一个 refill 周期
            const need = remaining - this.tokens;
            const waitMs = Math.ceil((need / this.bps) * 1000);
            this.tokens = 0;
            await delay(Math.max(1, waitMs));
          }
        }

        this.push(chunk);
        cb();
      } catch (err) {
        cb(err as Error);
      }
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    if (elapsed <= 0) return;

    this.tokens = Math.min(this.burst, this.tokens + elapsed * this.bps);
    this.lastRefill = now;
  }
}
