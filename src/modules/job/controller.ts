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
import { BaseController } from "@/core/base/controller.js";
import { JobRepository } from "./repository.js";
import { startJob, stopJob, runJobOnce } from "./scheduler.js";
import { prisma } from "@/config/database.js";
import { success } from "@/common/utils/response.js";
import { z } from "zod";
import { JobService } from "./service.js";
import { upload } from "../user/controller.js";
import { AppError } from "@/core/errors.js";

@Controller("/job", { tags: ["定时任务"] })
export default class JobController extends BaseController<any, any, any, any> {
  protected readonly repository = new JobRepository();
  protected readonly service = new JobService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/job",
    tags: ["定时任务"],
    permissionPrefix: "monitor:job",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
  };
  protected readonly createSchema = z.object({
    jobName: z.string().min(1).max(128),
    jobGroup: z.string().default("DEFAULT"),
    invokeTarget: z.string().min(1).max(256),
    cronExpression: z.string().min(1).max(64),
    status: z.string().default("1"),
    remark: z.string().max(512).optional(),
  });
  protected readonly updateSchema = this.createSchema.partial();
  protected readonly querySchema = null;

  protected buildListWhere(q: any) {
    const where: any = {};
    if (q.jobName) where.job_name = { contains: q.jobName };
    if (q.status) where.status = q.status;
    return where;
  }

  @Put("/:id/status")
  @ApiOperation("启停任务")
  @ApiBody(z.object({ status: z.enum(["0", "1"]) }))
  async toggleStatus(@Req() req: Request, @Res() res: Response) {
    const { status } = req.body;
    await this.service.toggleStatus(req.params.id, status, req.tenantId!);
    success(res, null, status === "1" ? "已启动" : "已停止");
  }

  @Post("/:id/run")
  @ApiOperation("立即执行")
  async runOnce(@Req() req: Request, @Res() res: Response) {
    await this.service.runOnce(req.params.id, req.tenantId!);
    success(res, null, "已执行");
  }

  @Get("/log/list")
  @ApiOperation("任务日志")
  async logList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }

  @Delete("/log/clear")
  @ApiOperation("清空日志")
  async clearLog(@Req() req: Request, @Res() res: Response) {
    await (this.repository as JobRepository).clearLogs(
      req.query.jobId as string,
    );
    success(res, null, "已清空");
  }
  @Get("/list")
  @ApiOperation("任务列表")
  async jobList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }
  @Post("/")
  @ApiOperation("创建任务")
  async jobCreate(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }
  @Put("/:id/pause")
  @ApiOperation("暂停任务")
  async pause(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.pause(req.params.id, req.tenantId!);
      success(res, null, "已暂停");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/resume")
  @ApiOperation("恢复任务")
  async resume(@Req() req: Request, @Res() res: Response) {
    try {
      await this.service.resume(req.params.id, req.tenantId!);
      success(res, null, "已恢复");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Get("/export")
  @ApiOperation("导出定时任务")
  async export(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(req.tenantId!);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=jobs_${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }

  @Post("/import")
  @ApiOperation("导入定时任务")
  async import(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err)
        return this.handleError(res, new AppError("文件上传失败", 400001, 400));
      if (!req.file)
        return this.handleError(res, new AppError("请上传 Excel", 400001, 400));
      const result = await this.service.importFromExcel(
        req.file.buffer,
        req.tenantId!,
        req.user?.userId,
      );
      success(res, result, "导入完成");
    });
  }
}
