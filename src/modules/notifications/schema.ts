import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const NotificationSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string().nullable(),
    type: z.enum(["SYSTEM", "ANNOUNCEMENT", "PERSONAL", "TASK"]),
    targetType: z.enum(["ALL", "ROLE", "USER"]),
    priority: z.number(),
    isRead: z.boolean(),
    readAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("Notification");

export const CreateNotificationBody = z
  .object({
    title: z.string().min(1).max(200),
    content: z.string().optional(),
    type: z.enum(["SYSTEM", "ANNOUNCEMENT", "PERSONAL", "TASK"]),
    targetType: z.enum(["ALL", "ROLE", "USER"]),
    targetRoles: z.array(z.string()).optional(),
    targetUsers: z.array(z.string()).optional(),
    priority: z.number().min(0).max(2).optional().default(0),
    publishAt: z.string().datetime().optional(),
    expireAt: z.string().datetime().optional(),
  })
  .openapi("CreateNotificationBody");
