import WebSocket from "ws";
import { logger } from "@/core/logger/index.js";
import { sendAlert } from "../alert/index.js";

type MessageType = "notice" | "chat" | "announcement";

interface WSClientMeta {
  userId: string;
  tenantId: string;
  type: MessageType;
}

/** 单用户最大连接数（多设备限制） */
const MAX_CONNECTIONS_PER_USER = 5;

/** 心跳超时阈值（连续 N 次未响应 pong 则断开） */
const HEARTBEAT_TIMEOUT_TICKS = 2;
const WS_ALERT_THRESHOLD = 5000;
let lastAlerted = 0;
class WebSocketManager {
  private connectionsByType: Map<MessageType, Set<WebSocket>> = new Map();
  private connectionsByUser: Map<string, Set<WebSocket>> = new Map();
  private wsMeta: WeakMap<WebSocket, WSClientMeta> = new WeakMap();

  /** 心跳状态：ws → 未响应次数 */
  private heartbeatState: Map<WebSocket, number> = new Map();

  addConnection(meta: WSClientMeta, ws: WebSocket): void {
    // ⭐ 单用户连接数上限
    const userSet = this.connectionsByUser.get(meta.userId);
    if (userSet && userSet.size >= MAX_CONNECTIONS_PER_USER) {
      // 踢最早的
      const first = userSet.values().next().value as WebSocket | undefined;
      if (first) {
        logger.warn(
          { userId: meta.userId, count: userSet.size },
          "[ws] connection limit reached, closing oldest",
        );
        try {
          first.close(1008, "Too many connections");
        } catch {}
        this.removeConnection(first);
      }
    }

    // 按类型
    if (!this.connectionsByType.has(meta.type)) {
      this.connectionsByType.set(meta.type, new Set());
    }
    this.connectionsByType.get(meta.type)!.add(ws);

    // 按用户
    if (!this.connectionsByUser.has(meta.userId)) {
      this.connectionsByUser.set(meta.userId, new Set());
    }
    this.connectionsByUser.get(meta.userId)!.add(ws);

    this.wsMeta.set(ws, meta);
    this.heartbeatState.set(ws, 0);

    logger.debug(
      {
        userId: meta.userId,
        type: meta.type,
        total: this.connectionsByUser.get(meta.userId)!.size,
      },
      "WebSocket connection added",
    );
    let total = 0;
    for (const set of this.connectionsByUser.values()) total += set.size;
    if (total > WS_ALERT_THRESHOLD && Date.now() - lastAlerted > 300_000) {
      lastAlerted = Date.now();
      void sendAlert({
        level: "warning",
        title: "ws_connections_high",
        message: `WebSocket 连接数过高：${total}`,
        source: "ws",
        data: { total, users: this.connectionsByUser.size },
      });
    }
  }

  removeConnection(ws: WebSocket): void {
    const meta = this.wsMeta.get(ws);
    if (!meta) return;

    const typeSet = this.connectionsByType.get(meta.type);
    typeSet?.delete(ws);
    if (typeSet?.size === 0) this.connectionsByType.delete(meta.type);

    const userSet = this.connectionsByUser.get(meta.userId);
    userSet?.delete(ws);
    if (userSet?.size === 0) this.connectionsByUser.delete(meta.userId);

    this.wsMeta.delete(ws);
    this.heartbeatState.delete(ws);

    logger.debug(
      { userId: meta.userId, type: meta.type },
      "WebSocket connection removed",
    );
  }

  /** ⭐ 标记心跳成功 */
  markAlive(ws: WebSocket): void {
    if (this.heartbeatState.has(ws)) {
      this.heartbeatState.set(ws, 0);
    }
  }

  /** ⭐ 心跳 tick：返回所有超时需断开的连接 */
  tickHeartbeat(): WebSocket[] {
    const toTerminate: WebSocket[] = [];
    for (const [ws, missCount] of this.heartbeatState.entries()) {
      if (ws.readyState !== WebSocket.OPEN) {
        this.removeConnection(ws);
        continue;
      }
      const next = missCount + 1;
      if (next >= HEARTBEAT_TIMEOUT_TICKS) {
        toTerminate.push(ws);
      } else {
        this.heartbeatState.set(ws, next);
        try {
          ws.ping();
        } catch {}
      }
    }
    return toTerminate;
  }

  sendToUser(userId: string, data: any): void {
    const userSet = this.connectionsByUser.get(userId);
    if (!userSet || userSet.size === 0) return;
    const message = JSON.stringify(data);
    userSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  }

  sendToUsers(userIds: string[], data: any): void {
    userIds.forEach((id) => this.sendToUser(id, data));
  }

  sendToType(type: MessageType, data: any): void {
    const typeSet = this.connectionsByType.get(type);
    if (!typeSet || typeSet.size === 0) return;
    const message = JSON.stringify(data);
    typeSet.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    });
  }

  /** ⭐ 关闭所有连接（用于 shutdown） */
  closeAll(reason = "server shutdown"): void {
    for (const set of this.connectionsByUser.values()) {
      set.forEach((ws) => {
        try {
          ws.close(1001, reason);
        } catch {}
      });
    }
    this.connectionsByType.clear();
    this.connectionsByUser.clear();
    this.heartbeatState.clear();
  }

  getStats() {
    let total = 0;
    for (const set of this.connectionsByUser.values()) total += set.size;
    return {
      total,
      users: this.connectionsByUser.size,
      byType: Object.fromEntries(
        [...this.connectionsByType.entries()].map(([k, v]) => [k, v.size]),
      ),
    };
  }
}

export const wsManager = new WebSocketManager();
