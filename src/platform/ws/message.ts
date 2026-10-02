import { redis, subRedis } from "@/core/index.js";
import { wsManager } from "./manager.js";

export async function publishMessagePush(params: {
  tenantId: string;
  receiverIds: string[];
  payload: Record<string, unknown>;
}): Promise<void> {
  await redis.publish("ws:message-push", JSON.stringify(params));
}
export const startMessagePushSubscriber = () => {
  subRedis.subscribe("ws:message-push");
  subRedis.on("message", (channel, message) => {
    if (channel !== "ws:message-push") return;
    const { receiverIds, payload } = JSON.parse(message);
    for (const uid of receiverIds) {
      wsManager.sendToUser(uid, {
        type: "message",
        data: payload,
        timestamp: Date.now(),
      });
    }
  });
};
