import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { jwtVerify } from "jose";
import { wsManager } from "./manager.js";
import { logger } from "@/core/logger/index.js";
import { env } from "@/config/env.js";
import { activeWsConnections } from "@/core/metrics/index.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const HEARTBEAT_INTERVAL = 30000;

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      const type = (url.searchParams.get("type") || "notice") as any;

      if (!token) {
        ws.close(1008, "Missing token");
        return;
      }

      const { payload } = await jwtVerify(token, secret, {
        clockTolerance: 60,
      });
      if (payload.type !== "access") {
        ws.close(1008, "Invalid token type");
        return;
      }

      const userId = payload.userId as string;
      const tenantId = payload.tenantId as string;
      const deviceId = payload.deviceId as string;
      if (!userId || !tenantId) {
        ws.close(1008, "Invalid token payload");
        return;
      }

      wsManager.addConnection({ userId, tenantId, type }, ws);

      // 更新指标
      try {
        activeWsConnections.inc();
      } catch {}

      ws.send(JSON.stringify({ type: "connected", data: { userId } }));

      // ⭐ 心跳：收到 pong 标记存活
      ws.on("pong", () => {
        wsManager.markAlive(ws);
      });

      ws.on("close", () => {
        wsManager.removeConnection(ws);
        try {
          activeWsConnections.dec();
        } catch {}
      });

      ws.on("error", (err) => {
        logger.error({ err, userId }, "WebSocket error");
        wsManager.removeConnection(ws);
        try {
          activeWsConnections.dec();
        } catch {}
      });
    } catch (err) {
      logger.warn({ err }, "WebSocket auth failed");
      ws.close(1008, "Invalid token");
    }
  });

  // ⭐ 全局心跳（不再每个连接一个 setInterval）
  const heartbeatTimer = setInterval(() => {
    const timeout = wsManager.tickHeartbeat();
    for (const ws of timeout) {
      logger.warn("[ws] heartbeat timeout, terminating");
      try {
        ws.terminate();
      } catch {}
      wsManager.removeConnection(ws);
    }
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(heartbeatTimer);
  });

  return wss;
}
