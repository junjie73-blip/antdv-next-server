import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { ExportService } from "./service.js";
import { getClientIp } from "@/shared/utils/ip.js";

const SubmitSchema = z.object({
  bizType: z.string().min(1).max(64),
  exportFormat: z.enum(["xlsx", "csv", "json"]).default("xlsx"),
  queryParams: z.record(z.string(), z.any()).optional(),
  columns: z.array(z.string()).optional(),
});

const ListQuery = z.object({
  status: z
    .enum([
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "expired",
    ])
    .optional(),
  bizType: z.string().max(64).optional(),
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const TypesQuery = z.object({}); // 未来可过滤

@Controller("/system/export", { tags: ["数据导出"] })
export default class ExportController {
  private service = new ExportService();

  @Get("/types")
  @RequirePermission("system:export:list")
  @ApiOperation("支持的导出业务类型")
  @ApiQuery(TypesQuery)
  async types(@Req() _req: Request, @Res() res: Response) {
    const { EXPORT_HANDLERS } = await import("./handlers/index.js");
    return success(
      res,
      Object.values(EXPORT_HANDLERS).map((h) => ({
        bizType: h.bizType,
        label: h.label,
      })),
    );
  }

  @Post("/submit")
  @RequirePermission("system:export:submit")
  @ApiOperation("提交导出任务")
  @ApiBody(SubmitSchema)
  async submit(@Req() req: Request, @Res() res: Response) {
    const dto = SubmitSchema.parse(req.body);
    const result = await this.service.submit({
      tenantId: req.tenantId!,
      userId: req.user!.userId,
      ...dto,
    });
    return success(res, result, "任务已提交");
  }

  @Get("/list")
  @RequirePermission("system:export:list")
  @ApiOperation("我的导出任务列表")
  @ApiQuery(ListQuery)
  async list(@Req() req: Request, @Res() res: Response) {
    const dto = ListQuery.parse(req.query);
    const data = await this.service.list({
      tenantId: req.tenantId!,
      userId: req.user!.userId, // 只查自己的
      ...dto,
    });
    return pageSuccess(res, data.list, data.total, dto.pageNum, dto.pageSize);
  }

  @Get("/:id")
  @RequirePermission("system:export:list")
  @ApiOperation("任务详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    return success(
      res,
      await this.service.detail(req.params.id, req.tenantId!, req.user!.userId),
    );
  }

  @Get("/:id/download")
  @RequirePermission("system:export:list")
  @ApiOperation("获取下载链接")
  async download(@Req() req: Request, @Res() res: Response) {
    const ip = getClientIp(req) ?? "unknown";
    const data = await this.service.getDownload(
      req.params.id,
      req.tenantId!,
      req.user!.userId,
      ip,
    );
    return success(res, data);
  }

  @Post("/:id/cancel")
  @RequirePermission("system:export:submit")
  @ApiOperation("取消任务")
  async cancel(@Req() req: Request, @Res() res: Response) {
    await this.service.cancel(req.params.id, req.tenantId!, req.user!.userId);
    return success(res, null, "已取消");
  }

  @Delete("/:id")
  @RequirePermission("system:export:submit")
  @ApiOperation("删除任务")
  async remove(@Req() req: Request, @Res() res: Response) {
    await this.service.remove(req.params.id, req.tenantId!, req.user!.userId);
    return success(res, null, "已删除");
  }
}
