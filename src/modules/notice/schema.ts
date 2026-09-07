import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const NoticeCreateSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().optional(),
  noticeType: z.number().int().min(1).max(3).default(1),
  status: z.number().int().min(0).max(1).default(1),
  publishTime: z.string().datetime().optional(),
  targetUserIds: z.array(z.string().uuid()).optional(), // 新增
});
export const NoticeUpdateSchema =
  NoticeCreateSchema.partial().openapi("NoticeUpdate");

export const NoticeListSchema = z
  .object({
    pageNum: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10),
    keyword: z.string().optional().openapi({ description: "标题关键字" }),
    noticeType: z.string().optional(),
    status: z.string().optional(),
  })
  .openapi("NoticeList");
