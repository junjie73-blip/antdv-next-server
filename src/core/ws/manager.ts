import WebSocket from "ws";
import { logger } from "@/core/logger/index.js";

type MessageType = "notice" | "chat" | "announcement"; // 可按需扩展

interface WSClientMeta {
  userId: string;
  tenantId: string;
  type: MessageType;
}

class WebSocketManager {
  // 按类型存储连接（用于广播）
  private connectionsByType: Map<MessageType, Set<WebSocket>> = new Map();

  // 按用户存储连接（用于精确推送）
  private connectionsByUser: Map<string, Set<WebSocket>> = new Map();

  // 存储连接关联的元数据，方便关闭时清理
  private wsMeta: WeakMap<WebSocket, WSClientMeta> = new WeakMap();

  /**
   * 添加连接
   */
  addConnection(meta: WSClientMeta, ws: WebSocket) {
    // 按类型分组
    if (!this.connectionsByType.has(meta.type)) {
      this.connectionsByType.set(meta.type, new Set());
    }
    this.connectionsByType.get(meta.type)!.add(ws);

    // 按用户分组
    if (!this.connectionsByUser.has(meta.userId)) {
      this.connectionsByUser.set(meta.userId, new Set());
    }
    this.connectionsByUser.get(meta.userId)!.add(ws);

    this.wsMeta.set(ws, meta);
    logger.debug(
      { userId: meta.userId, type: meta.type },
      "WebSocket connection added",
    );
  }

  /**
   * 移除连接
   */
  removeConnection(ws: WebSocket) {
    const meta = this.wsMeta.get(ws);
    if (!meta) return;

    // 从类型分组中移除
    const typeSet = this.connectionsByType.get(meta.type);
    typeSet?.delete(ws);
    if (typeSet?.size === 0) {
      this.connectionsByType.delete(meta.type);
    }

    // 从用户分组中移除
    const userSet = this.connectionsByUser.get(meta.userId);
    userSet?.delete(ws);
    if (userSet?.size === 0) {
      this.connectionsByUser.delete(meta.userId);
    }

    this.wsMeta.delete(ws);
    logger.debug(
      { userId: meta.userId, type: meta.type },
      "WebSocket connection removed",
    );
  }

  /**
   * 向指定用户发送消息（支持多端）
   */
  sendToUser(userId: string, data: any) {
    const userSet = this.connectionsByUser.get(userId);
    if (!userSet || userSet.size === 0) return;

    const message = JSON.stringify(data);
    userSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * 向多个用户发送同一条消息
   */
  sendToUsers(userIds: string[], data: any) {
    userIds.forEach((userId) => this.sendToUser(userId, data));
  }

  /**
   * 向指定类型的所有连接广播（用于特殊场景）
   */
  sendToType(type: MessageType, data: any) {
    const typeSet = this.connectionsByType.get(type);
    if (!typeSet || typeSet.size === 0) return;

    const message = JSON.stringify(data);
    typeSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export const wsManager = new WebSocketManager();
