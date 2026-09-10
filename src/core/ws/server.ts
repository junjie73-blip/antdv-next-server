import { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import { jwtVerify } from "jose";
import { wsManager } from "./manager.js";
import { logger } from "@/core/logger/index.js";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret",
);

export function initWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");
      const type = (url.searchParams.get("type") || "notice") as any; // 默认 notice

      if (!token) {
        ws.close(1008, "Missing token");
        return;
      }

      // 验证 JWT
      const { payload } = await jwtVerify(token, secret);
      const userId = payload.userId as string;
      const tenantId = payload.tenantId as string;

      // 注册连接
      wsManager.addConnection({ userId, tenantId, type }, ws);

      // 可选：发送连接确认
      ws.send(JSON.stringify({ type: "connected", data: { userId } }));

      // 心跳处理
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on("pong", () => {
        /* 连接存活 */
      });

      ws.on("close", () => {
        clearInterval(pingInterval);
        wsManager.removeConnection(ws);
      });

      ws.on("error", (error) => {
        logger.error({ error }, "WebSocket error");
        clearInterval(pingInterval);
        wsManager.removeConnection(ws);
      });
    } catch (err) {
      ws.close(1008, "Invalid token");
    }
  });

  return wss;
}
