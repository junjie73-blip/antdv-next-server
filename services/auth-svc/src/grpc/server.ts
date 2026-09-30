import * as grpc from "@grpc/grpc-js";
import { loadProto } from "@saas/contracts/grpc";
import { logger } from "../config/logger.js";
import { authHandler } from "./auth.handler.js";

export async function createGrpcServer(): Promise<grpc.Server> {
  const server = new grpc.Server();

  // 运行时加载 proto
  const proto = loadProto<any>("auth.proto");
  server.addService(proto.saas.auth.AuthService.service, authHandler);

  logger.info("[grpc] AuthService registered");
  return server;
}
