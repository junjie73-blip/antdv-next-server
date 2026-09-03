import { env } from "./env.js";
import { logger } from "@common/logger/index.js";

export const serverConfig = {
  port: parseInt(env.PORT, 10),
  host: env.HOST,
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === "production",

  // 连接数与并发限制
  maxConnections: env.NODE_ENV === "production" ? 1000 : 100,
  keepAliveTimeout: 30000, // ms
  headersTimeout: 35000,

  // 请求体限制
  jsonLimit: "10mb",
  urlencodedLimit: "10mb",

  // 超时配置
  requestTimeout: 30000,
};

export function setupGracefulShutdown(server: any) {
  const shutdown = (signal: string) => {
    logger.info(`收到 ${signal}，开始优雅关闭...`);
    server.close(() => {
      logger.info("HTTP 服务器已关闭");
      process.exit(0);
    });

    // 强制退出兜底
    setTimeout(() => {
      logger.fatal("强制退出：关闭超时");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "未捕获异常");
    shutdown("uncaughtException");
  });
  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "未处理的 Promise 拒绝");
  });
}
