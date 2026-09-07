import { WebSocketServer } from "ws";
import { Server } from "http";
import { wsManager } from "./manager.js";
import { logger } from "@/core/logger/index.js";
import { verifyAccessToken } from "@/common/security/jwt.js";

export function initWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" }); // 路径可自定义

  wss.on("connection", async (ws, req) => {
    // 从查询参数或 Header 中获取 token
    const token = new URL(
      req.url!,
      `http://${req.headers.host}`,
    ).searchParams.get("token");
    if (!token) {
      ws.close(1008, "Unauthorized");
      return;
    }

    try {
      const payload = await verifyAccessToken(token); // 解析出 { userId, tenantId }
      const { userId, tenantId } = payload;

      // 保存连接
      wsManager.addConnection(tenantId as string, userId as string, ws);

      // 发送欢迎消息（可选）
      ws.send(
        JSON.stringify({ type: "connected", message: "WebSocket connected" }),
      );

      // 处理关闭
      ws.on("close", () => {
        wsManager.removeConnection(tenantId as string, userId as string, ws);
      });

      ws.on("error", (error) => {
        logger.error({ error }, "WebSocket error");
        wsManager.removeConnection(tenantId as string, userId as string, ws);
      });
    } catch (error) {
      ws.close(1008, "Invalid token");
    }
  });

  return wss;
}
