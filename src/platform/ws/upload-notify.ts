import { subRedis, redis } from "@/config/redis.js";
import { wsManager } from "./manager.js";
import { logger } from "@/platform/logger/index.js";

const UPLOAD_NOTIFY_CHANNEL = "upload:merge-notify";

export interface UploadMergeNotifyPayload {
  userId: string;
  taskId: string;
  status: "completed" | "failed";
  fileId?: string;
  url?: string;
  size?: number;
  filename?: string;
  errorMsg?: string;
  at?: number;
}

export async function publishUploadNotify(
  payload: UploadMergeNotifyPayload,
): Promise<void> {
  await redis.publish(
    UPLOAD_NOTIFY_CHANNEL,
    JSON.stringify({ ...payload, at: Date.now() }),
  );
  logger.info(
    { userId: payload.userId, taskId: payload.taskId, status: payload.status },
    "[upload] merge notify published",
  );
}

export async function startUploadNotifySubscriber(): Promise<void> {
  try {
    await subRedis.subscribe(UPLOAD_NOTIFY_CHANNEL);

    subRedis.on("message", (channel: string, message: string) => {
      if (channel !== UPLOAD_NOTIFY_CHANNEL) return;
      try {
        const data = JSON.parse(message) as UploadMergeNotifyPayload;
        wsManager.sendToUsers([data.userId], {
          type: "upload:merge",
          data: {
            taskId: data.taskId,
            status: data.status,
            fileId: data.fileId,
            url: data.url,
            size: data.size,
            filename: data.filename,
            errorMsg: data.errorMsg,
          },
          timestamp: Date.now(),
        });
      } catch (err) {
        logger.error(
          { err, message },
          "Failed to handle upload:merge notify message",
        );
      }
    });

    subRedis.on("error", (err) =>
      logger.error({ err }, "Upload merge-notify subscriber error"),
    );

    logger.info(`Subscribed to Redis channel: ${UPLOAD_NOTIFY_CHANNEL}`);
  } catch (err) {
    logger.error({ err }, "Failed to subscribe to upload:merge channel");
  }
}
