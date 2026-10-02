import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { NOTIFY_CHANNELS, NOTIFY_EVENTS, EVENT_ALL } from "./constants.js";

extendZodWithOpenApi(z);

const EventEnum = z.union([
  z.enum(NOTIFY_EVENTS as [string, ...string[]]),
  z.literal(EVENT_ALL),
]);

export const PreferenceItemSchema = z.object({
  channel: z.enum(NOTIFY_CHANNELS as [string, ...string[]]),
  eventType: EventEnum,
  enabled: z.number().int().min(0).max(1),
});

export const PreferenceBatchSetSchema = z
  .object({
    items: z.array(PreferenceItemSchema).min(1).max(64),
  })
  .openapi("NoticePreferenceBatchSet");

export const PreferenceResetSchema = z
  .object({
    /** 不传 = 恢复全部默认；传 channel = 只恢复指定渠道 */
    channel: z.enum(NOTIFY_CHANNELS as [string, ...string[]]).optional(),
  })
  .openapi("NoticePreferenceReset");

export type PreferenceItemDTO = z.infer<typeof PreferenceItemSchema>;
export type PreferenceBatchSetDTO = z.infer<typeof PreferenceBatchSetSchema>;
