import type { Interceptor } from "@grpc/grpc-js";
import { InterceptingCall, status } from "@grpc/grpc-js";

interface RetryOptions {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  initialBackoffMs: 200,
  maxBackoffMs: 2_000,
  retryableStatuses: [
    status.UNAVAILABLE,
    status.DEADLINE_EXCEEDED,
    status.RESOURCE_EXHAUSTED,
  ],
};

/**
 * 幂等重试拦截器
 * ⚠️ 只对幂等方法启用（VerifyToken / GetUser 等）
 */
export function retryInterceptor(
  opts: Partial<RetryOptions> = {},
): Interceptor {
  const config = { ...DEFAULT_RETRY, ...opts };

  return (options, nextCall) => {
    let attempt = 0;
    let cancelled = false;
    let currentCall: InterceptingCall | null = null;

    const makeCall = (): InterceptingCall => {
      return new InterceptingCall(nextCall(options), {
        start(metadata, listener, next) {
          next(metadata, {
            onReceiveMetadata: listener.onReceiveMetadata,
            onReceiveMessage: listener.onReceiveMessage,
            onReceiveStatus(status_, nextStatus) {
              if (cancelled) {
                nextStatus(status_);
                return;
              }

              const shouldRetry =
                attempt < config.maxAttempts - 1 &&
                config.retryableStatuses.includes(status_.code);

              if (!shouldRetry) {
                nextStatus(status_);
                return;
              }

              attempt++;
              const delay = Math.min(
                config.initialBackoffMs * 2 ** (attempt - 1),
                config.maxBackoffMs,
              );

              setTimeout(() => {
                if (cancelled) return;
                currentCall = makeCall();
              }, delay);
            },
          });
        },
        cancel() {
          cancelled = true;
        },
      });
    };

    currentCall = makeCall();
    return currentCall;
  };
}
