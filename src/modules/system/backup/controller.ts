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
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { BackupService } from "./service.js";
import { BackupListSchema, BackupTriggerSchema, BackupPolicySchema } from "./schema.js";

@Controller("/system/backup", { tags: ["数据库备份"] })
export default class BackupController {
  private service = new BackupService();

  /* ==================== 备份记录 ==================== */

  @Get("/list")
  @ApiOperation("备份记录列表")
  @ApiQuery(BackupListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const dto = BackupListSchema.parse(req.query);
    const data = await this.service.list(dto);
    return pageSuccess(res, data.list, data.total, dto.pageNum, dto.pageSize);
  }

  /* ==================== 策略 ==================== */

  @Get("/policies")
  @ApiOperation("策略列表")
  async policies(@Req() _req: Request, @Res() res: Response) {
    return success(res, await this.service.listPolicies());
  }

  @Put("/policies")
  @ApiOperation("保存策略")
  @ApiBody(BackupPolicySchema)
  async savePolicy(@Req() req: Request, @Res() res: Response) {
    const dto = BackupPolicySchema.parse(req.body);
    await this.service.upsertPolicy({ ...dto, userId: req.user?.userId });
    return success(res, null, "保存成功");
  }

  @Delete("/policies/:id")
  async removePolicy(@Req() req: Request, @Res() res: Response) {
    await this.service.deletePolicy(req.params.id, req.user!.userId);
    return success(res, null, "已删除");
  }
  @Get("/:id")
  @ApiOperation("备份详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    return success(res, await this.service.detail(req.params.id));
  }

  @Post("/trigger")
  @ApiOperation("手动触发备份")
  @ApiBody(BackupTriggerSchema)
  async trigger(@Req() req: Request, @Res() res: Response) {
    const dto = BackupTriggerSchema.parse(req.body ?? {});
    const result = await this.service.trigger({
      triggerType: "manual",
      backupType: dto.backupType,
      remark: dto.remark,
      retainDays: dto.retainDays,
      userId: req.user?.userId,
    });
    return success(res, result, "备份任务已提交");
  }

  @Get("/:id/download")
  @ApiOperation("获取下载链接")
  async download(@Req() req: Request, @Res() res: Response) {
    return success(res, await this.service.getDownloadUrl(req.params.id));
  }

  @Delete("/:id")
  @ApiOperation("删除备份")
  async remove(@Req() req: Request, @Res() res: Response) {
    await this.service.remove(req.params.id);
    return success(res, null, "已删除");
  }
}
