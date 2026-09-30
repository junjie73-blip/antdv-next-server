import { createServer, type Server as HttpServer } from "http";
import type { Server as GrpcServer } from "@grpc/grpc-js";
import { ServerCredentials } from "@grpc/grpc-js";
import { createHttpApp } from "../http/router.js";
import { createGrpcServer } from "../grpc/server.js";
import { registerToConsul } from "../registry/consul.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

export interface ServerBundle {
  httpServer: HttpServer;
  grpcServer: GrpcServer;
}

export async function startServers(): Promise<ServerBundle> {
  // ---------- HTTP ----------
  const app = createHttpApp();
  const httpServer = createServer(app);

  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV, pid: process.pid },
        `🚀 HTTP listening :${env.PORT}`,
      );
      resolve();
    });
  });

  // ---------- gRPC ----------
  const grpcServer = await createGrpcServer();

  await new Promise<void>((resolve, reject) => {
    grpcServer.bindAsync(
      `0.0.0.0:${env.GRPC_PORT}`,
      ServerCredentials.createInsecure(),
      (err, boundPort) => {
        if (err) return reject(err);
        logger.info({ port: boundPort }, `🚀 gRPC listening :${boundPort}`);
        resolve();
      },
    );
  });

  // ---------- Consul 注册（HTTP + gRPC 都就绪后） ----------
  await registerToConsul();

  return { httpServer, grpcServer };
}
