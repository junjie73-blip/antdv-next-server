import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  Delete,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { RpExportTaskService } from "../service/export-task.service.js";
import { ExportTaskListSchema } from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/report/export-task", { tags: ["报表-导出任务"] })
export default class ExportTaskController {
  private service = new RpExportTaskService();

  @Get("/list")
  @ApiOperation("导出任务列表")
  @ApiQuery(ExportTaskListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = ExportTaskListSchema.parse(req.query);

    const result = await this.service.list({
      tenantId,
      userId,
      status: dto.status,
      reportCode: dto.reportCode,
      pageNum: dto.pageNum,
      pageSize: dto.pageSize,
    });

    return pageSuccess(
      res,
      result.list,
      result.total,
      dto.pageNum,
      dto.pageSize,
    );
  }

  @Get("/stats")
  @ApiOperation("导出任务统计")
  async stats(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const data = await this.service.stats({ tenantId, userId });
    return success(res, data);
  }

  @Get("/trend")
  @ApiOperation("导出任务趋势（最近 7 天）")
  async trend(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const days = Number(req.query.days) || 7;
    const data = await this.service.trend({ tenantId, userId, days });
    return success(res, data);
  }
  @Delete("/:id")
  @ApiOperation("删除导出任务")
  async remove(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    await this.service.remove(req.params.id, tenantId, userId);
    return success(res, null, "已删除");
  }

  @Get("/:id")
  @ApiOperation("导出任务详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const data = await this.service.detail(req.params.id, tenantId, userId);
    return success(res, data);
  }

  @Post("/:id/cancel")
  @ApiOperation("取消导出任务")
  async cancel(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    await this.service.cancel(req.params.id, tenantId, userId);
    return success(res, null, "已取消");
  }

  @Post("/:id/retry")
  @ApiOperation("重试导出任务")
  async retry(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    await this.service.retry(req.params.id, tenantId, userId);
    return success(res, null, "已重新提交");
  }
}
