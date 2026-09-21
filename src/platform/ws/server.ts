import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { jwtVerify } from "jose";
import { wsManager } from "./manager.js";
import { logger } from "@/platform/logger/index.js";
import { env } from "@/config/env.js";
import { activeWsConnections } from "@/platform/metrics/index.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
const HEARTBEAT_INTERVAL = 30_000;

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      const type = (url.searchParams.get("type") || "notice") as
        | "notice"
        | "chat"
        | "announcement";

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
      if (!userId || !tenantId) {
        ws.close(1008, "Invalid token payload");
        return;
      }

      wsManager.addConnection({ userId, tenantId, type }, ws);
      try {
        activeWsConnections.inc();
      } catch {}

      ws.send(JSON.stringify({ type: "connected", data: { userId } }));

      // ⭐ 只 dec 一次（防 error + close 双 dec）
      let decDone = false;
      const safeDec = () => {
        if (decDone) return;
        decDone = true;
        try {
          activeWsConnections.dec();
        } catch {}
      };

      ws.on("pong", () => wsManager.markAlive(ws));
      ws.on("close", () => {
        wsManager.removeConnection(ws);
        safeDec();
      });
      ws.on("error", (err) => {
        logger.error({ err, userId }, "WebSocket error");
        wsManager.removeConnection(ws);
        safeDec();
      });
    } catch (err) {
      logger.warn({ err }, "WebSocket auth failed");
      ws.close(1008, "Invalid token");
    }
  });

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

  wss.on("close", () => clearInterval(heartbeatTimer));

  return wss;
}
