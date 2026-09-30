import Consul from "consul";
import os from "node:os";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/** Consul 中注册的服务名（其它服务通过此名发现本服务） */
export const CONSUL_SERVICE_NAME = "auth-svc";

/** 唯一的实例 ID：service-hostname-pid */
function buildInstanceId(): string {
  const hostname = os.hostname().replace(/\./g, "-");
  return `${CONSUL_SERVICE_NAME}-${hostname}-${process.pid}`;
}

let consul: Consul | null = null;
let registeredId: string | null = null;

function getClient(): Consul {
  if (consul) return consul;
  consul = new Consul({
    host: env.CONSUL_HOST,
    port: Number(env.CONSUL_PORT),
  });
  return consul;
}

/**
 * 向 Consul 注册本服务
 * - HTTP 健康检查指向 /health/ready
 * - 关闭时自动摘除
 */
export async function registerToConsul(): Promise<void> {
  if (env.SERVICE_REGISTRY !== "consul") {
    logger.info(
      { registry: env.SERVICE_REGISTRY },
      "[consul] 未启用 consul 注册，跳过",
    );
    return;
  }

  const id = buildInstanceId();
  const address = env.SERVICE_HOST;
  const port = env.GRPC_PORT;

  try {
    await getClient().agent.service.register({
      id,
      name: CONSUL_SERVICE_NAME,
      address,
      port,
      tags: [`version=${env.SERVICE_VERSION}`, `env=${env.NODE_ENV}`, "grpc"],
      meta: {
        grpcPort: String(env.GRPC_PORT),
        httpPort: String(env.PORT),
        version: env.SERVICE_VERSION,
        env: env.NODE_ENV,
      },
      check: {
        id: `${id}-http`,
        name: "HTTP /health/ready",
        http: `http://${address}:${env.PORT}/health/ready`,
        interval: env.CONSUL_HEALTH_INTERVAL,
        timeout: env.CONSUL_HEALTH_TIMEOUT,
        deregistercriticalserviceafter: env.CONSUL_DEREGISTER_AFTER,
      },
    });

    registeredId = id;
    logger.info(
      { id, address, port, consul: `${env.CONSUL_HOST}:${env.CONSUL_PORT}` },
      "[consul] service registered",
    );
  } catch (err) {
    logger.error(
      { err, consul: `${env.CONSUL_HOST}:${env.CONSUL_PORT}` },
      "[consul] 注册失败，服务将以静态模式继续运行",
    );
    // 不抛异常，允许服务继续启动（本地开发没 Consul 时更友好）
  }
}

/**
 * 从 Consul 注销本服务
 * - 幂等
 * - 失败不抛异常
 */
export async function deregisterFromConsul(): Promise<void> {
  if (env.SERVICE_REGISTRY !== "consul") return;
  if (!registeredId) return;

  try {
    await getClient().agent.service.deregister({ id: registeredId });
    logger.info({ id: registeredId }, "[consul] service deregistered");
  } catch (err) {
    logger.warn({ err, id: registeredId }, "[consul] 注销失败");
  } finally {
    registeredId = null;
  }
}

/** 当前是否已注册成功 */
export function isConsulRegistered(): boolean {
  return registeredId !== null;
}
