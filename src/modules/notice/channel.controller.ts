import {
  Controller,
  Get,
  Put,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { prisma } from "@/config/database.js";
import { success } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { z } from "zod";

const CHANNEL_TYPES = ["in_app", "email", "sms", "webhook"] as const;

const ChannelUpsertSchema = z
  .object({
    channelType: z.enum(CHANNEL_TYPES),
    enabled: z.number().int().min(0).max(1).default(0),
    config: z.record(z.string(), z.any()).optional(),
    remark: z.string().max(256).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.channelType !== "email" || val.enabled !== 1) return;
    const c = val.config ?? {};
    const get = (...keys: string[]) => keys.map((k) => c[k]).find(Boolean);
    const host = get("host", "smtpHost");
    const user = get("user", "smtpUser");
    const pass = get("pass", "password", "smtpPass");
    const from = get("from", "smtpFrom") ?? user;
    const need: [string, any, string][] = [
      ["host", host, "SMTP 服务器地址"],
      ["user", user, "SMTP 用户名"],
      ["pass", pass, "SMTP 密码/授权码"],
    ];
    for (const [key, v, label] of need) {
      if (!v) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label}不能为空`,
          path: ["config", key],
        });
      }
    }
    if (
      from &&
      !/^[^<>]+<[^<>@\s]+@[^<>\s]+>$/.test(from) &&
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(from))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "发件人格式不合法，应为 a@b.com 或 名字 <a@b.com>",
        path: ["config", "from"],
      });
    }
  })
  .openapi("NoticeChannelUpsert");

function requireTenant(req: Request): string {
  const tenantId = req.tenantId;
  if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
  return tenantId;
}

@Controller("/notice-channel", { tags: ["通知渠道"] })
export default class NoticeChannelController {
  @Get("/list")
  @ApiOperation("渠道列表")
  async list(@Req() req: Request, @Res() res: Response) {
    const tenantId = requireTenant(req);
    const rows = await prisma.sys_notice_channel.findMany({
      where: { tenant_id: tenantId, is_deleted: 0 },
    });
    success(res, rows);
  }

  @Put("/")
  @ApiOperation("新增/更新渠道配置")
  @ApiBody(ChannelUpsertSchema)
  async upsert(@Req() req: Request, @Res() res: Response) {
    const tenantId = requireTenant(req);
    const dto = ChannelUpsertSchema.parse(req.body);

    // ⭐ upsert 并发安全
    await prisma.sys_notice_channel.upsert({
      where: {
        tenant_id_channel_type: {
          tenant_id: tenantId,
          channel_type: dto.channelType,
        },
      },
      update: {
        enabled: dto.enabled,
        config: dto.config ? JSON.stringify(dto.config) : null,
        remark: dto.remark ?? null,
        updated_by: req.user?.userId,
        updated_at: new Date(),
      },
      create: {
        tenant_id: tenantId,
        channel_type: dto.channelType,
        enabled: dto.enabled,
        config: dto.config ? JSON.stringify(dto.config) : null,
        remark: dto.remark ?? null,
        created_by: req.user?.userId,
        updated_by: req.user?.userId,
        is_deleted: 0,
      },
    });
    success(res, null, "保存成功");
  }

  @Delete("/:type")
  @ApiOperation("删除渠道配置")
  async remove(@Req() req: Request, @Res() res: Response) {
    const tenantId = requireTenant(req);
    const type = req.params.type;
    if (!CHANNEL_TYPES.includes(type as any)) {
      throw new AppError("无效的渠道类型", 400001, 400);
    }
    await prisma.sys_notice_channel.updateMany({
      where: { tenant_id: tenantId, channel_type: type, is_deleted: 0 },
      data: { is_deleted: 1, updated_at: new Date() },
    });
    success(res, null, "已删除");
  }
}
