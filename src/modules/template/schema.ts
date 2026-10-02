import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const TemplateParamSchema = z.object({
  name: z.string().min(1).max(64),
  label: z.string().min(1).max(64),
  type: z.enum(["string", "number", "date", "boolean"]).default("string"),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  description: z.string().max(256).optional(),
});

const ChannelEnum = z.enum([
  "email",
  "sms",
  "webhook",
  "wechat_work",
  "dingtalk",
]);
const ContentFormatEnum = z.enum(["markdown", "html", "text"]);
export const TemplateCreateSchema = z
  .object({
    templateCode: z
      .string()
      .min(2)
      .max(64)
      .regex(/^[a-zA-Z0-9_\-]+$/, "只能包含字母、数字、下划线、中划线")
      .openapi({ description: "模板编码" }),
    templateName: z
      .string()
      .min(2)
      .max(128)
      .openapi({ description: "模板名称" }),
    channelType: ChannelEnum.openapi({ description: "渠道类型" }),
    title: z.string().max(256).optional().openapi({ description: "模板标题" }),
    content: z.string().min(1).max(20000).openapi({ description: "模板内容" }),
    params: z
      .array(TemplateParamSchema)
      .default([])
      .openapi({ description: "变量定义" }),
    remark: z.string().max(512).optional(),
    status: z
      .string()
      .regex(/^[01]$/)
      .default("1")
      .openapi({ description: "0-禁用 1-启用" }),
    contentFormat: ContentFormatEnum.default("markdown").openapi({
      description: "内容格式",
    }),
  })
  .openapi("TemplateCreate");

export const TemplateUpdateSchema =
  TemplateCreateSchema.partial().openapi("TemplateUpdate");

export const TemplateListSchema = z
  .object({
    templateName: z.string().optional(),
    templateCode: z.string().optional(),
    channelType: ChannelEnum.optional(),
    status: z
      .string()
      .regex(/^[01]$/)
      .optional(),
  })
  .openapi("TemplateList");

/** 渲染预览 */
export const RenderPreviewSchema = z
  .object({
    content: z.string().min(1).max(20000),
    title: z.string().max(256).optional(),
    params: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("RenderPreview");

/** 测试发送 */
export const TestSendSchema = z
  .object({
    templateId: z.string().uuid(),
    receiver: z
      .string()
      .min(1)
      .max(256)
      .openapi({ description: "接收人：邮箱 / 手机号 / Webhook URL" }),
    params: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("TestSend");

export type TemplateCreateDTO = z.infer<typeof TemplateCreateSchema>;
export type TemplateUpdateDTO = z.infer<typeof TemplateUpdateSchema>;
export type TemplateListDTO = z.infer<typeof TemplateListSchema>;
export type RenderPreviewDTO = z.infer<typeof RenderPreviewSchema>;
export type TestSendDTO = z.infer<typeof TestSendSchema>;
export type TemplateParam = z.infer<typeof TemplateParamSchema>;
