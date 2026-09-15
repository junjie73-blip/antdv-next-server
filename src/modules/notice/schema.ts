import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const NoticeCreateSchema = z
  .object({
    title: z.string().min(1).max(256),
    content: z.string().optional(),
    noticeType: z.number().int().min(1).max(3).default(1),
    status: z.number().int().min(0).max(1).default(1),
    publishTime: z.string().datetime().optional(),
    targetUserIds: z.array(z.string().uuid()).optional(), // 新增
  })
  .openapi("NoticeCreate");
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
export const NoticeImportRowSchema = z.object({
  标题: z.string().min(1).max(256),
  内容: z.string().optional().default(""),
  类型: z.enum(["通知", "公告", "提醒"]).default("通知"),
  状态: z.enum(["草稿", "发布"]).default("发布"),
  发布时间: z.string().optional().default(""),
});

export const NoticeExportColumns = [
  { header: "标题", key: "title", width: 30 },
  { header: "内容", key: "content", width: 40 },
  {
    header: "类型",
    key: "notice_type",
    width: 10,
    formatter: (v: number) => (v === 1 ? "通知" : v === 2 ? "公告" : "提醒"),
  },
  {
    header: "状态",
    key: "status",
    width: 10,
    formatter: (v: string) => (v === "1" ? "已发布" : "草稿"),
  },
  { header: "发布时间", key: "publish_time", width: 20 },
] as const;
