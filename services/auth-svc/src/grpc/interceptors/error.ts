import type { Interceptor } from "@grpc/grpc-js";
import { InterceptingCall, status } from "@grpc/grpc-js";
import { logger } from "../../config/logger.js";

export const errorInterceptor: Interceptor = (_options, nextCall) => {
  return new InterceptingCall(nextCall(_options), {
    start(metadata, listener, next) {
      next(metadata, {
        onReceiveMetadata: listener.onReceiveMetadata,
        onReceiveMessage: listener.onReceiveMessage,
        onReceiveStatus(status_, nextStatus) {
          if (status_.code !== status.OK) {
            logger.warn(
              { code: status_.code, details: status_.details },
              "[grpc] rpc error",
            );
          }
          nextStatus(status_);
        },
      });
    },
  });
};
