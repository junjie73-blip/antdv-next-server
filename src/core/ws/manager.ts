import WebSocket from "ws";
import { logger } from "@/core/logger/index.js";

type UserConnections = Map<string, Set<WebSocket>>; // userId -> connections
type TenantConnections = Map<string, UserConnections>; // tenantId -> user connections

class WebSocketManager {
  private connections: TenantConnections = new Map();

  /**
   * 添加连接
   */
  addConnection(tenantId: string, userId: string, ws: WebSocket) {
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, new Map());
    }
    const userConns = this.connections.get(tenantId)!;
    if (!userConns.has(userId)) {
      userConns.set(userId, new Set());
    }
    userConns.get(userId)!.add(ws);
    logger.debug({ tenantId, userId }, "WebSocket connection added");
  }

  /**
   * 移除连接
   */
  removeConnection(tenantId: string, userId: string, ws: WebSocket) {
    const userConns = this.connections.get(tenantId)?.get(userId);
    if (userConns) {
      userConns.delete(ws);
      if (userConns.size === 0) {
        this.connections.get(tenantId)!.delete(userId);
      }
    }
    logger.debug({ tenantId, userId }, "WebSocket connection removed");
  }

  /**
   * 向指定用户发送消息（支持多端）
   */
  sendToUser(tenantId: string, userId: string, data: any) {
    const userConns = this.connections.get(tenantId)?.get(userId);
    if (!userConns || userConns.size === 0) return;

    const message = JSON.stringify(data);
    userConns.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * 向多个用户发送同一条消息
   */
  sendToUsers(tenantId: string, userIds: string[], data: any) {
    userIds.forEach((userId) => this.sendToUser(tenantId, userId, data));
  }
}

// 单例导出
export const wsManager = new WebSocketManager();
