import {
  Controller,
  Get,
  Post,
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
import { success } from "@/common/utils/response.js";
import { AppError } from "@/core/errors.js";
import { z } from "zod";

const ChannelUpsertSchema = z.object({
  channelType: z.enum(["in_app", "email", "sms", "webhook"]),
  enabled: z.number().int().min(0).max(1).default(0),
  config: z.record(z.string(), z.any()).optional(),
  remark: z.string().max(256).optional(),
});

@Controller("/notice-channel", { tags: ["通知渠道"] })
export default class NoticeChannelController {
  @Get("/list")
  @ApiOperation("渠道列表")
  async list(@Req() req: Request, @Res() res: Response) {
    const rows = await prisma.sys_notice_channel.findMany({
      where: { tenant_id: req.tenantId!, is_deleted: 0 },
    });
    success(res, rows);
  }

  @Put("/")
  @ApiOperation("新增/更新渠道配置")
  @ApiBody(ChannelUpsertSchema)
  async upsert(@Req() req: Request, @Res() res: Response) {
    const dto = ChannelUpsertSchema.parse(req.body);
    const tenantId = req.tenantId!;
    const existing = await prisma.sys_notice_channel.findFirst({
      where: { tenant_id: tenantId, channel_type: dto.channelType },
    });
    const data = {
      enabled: dto.enabled,
      config: dto.config ? JSON.stringify(dto.config) : null,
      remark: dto.remark ?? null,
      updated_by: req.user?.userId,
      updated_at: new Date(),
    };
    if (existing) {
      await prisma.sys_notice_channel.update({
        where: { channel_id: existing.channel_id },
        data,
      });
    } else {
      await prisma.sys_notice_channel.create({
        data: {
          tenant_id: tenantId,
          channel_type: dto.channelType,
          created_by: req.user?.userId,
          ...data,
        },
      });
    }
    success(res, null, "保存成功");
  }

  @Delete("/:type")
  @ApiOperation("删除渠道配置")
  async remove(@Req() req: Request, @Res() res: Response) {
    await prisma.sys_notice_channel.updateMany({
      where: {
        tenant_id: req.tenantId!,
        channel_type: req.params.type,
        is_deleted: 0,
      },
      data: { is_deleted: 1, updated_at: new Date() },
    });
    success(res, null, "已删除");
  }
}
