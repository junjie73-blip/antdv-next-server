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
import { BaseController } from "@/core/base-controller.js";
import { JobRepository } from "./repository.js";
import { startJob, stopJob, runJobOnce } from "./scheduler.js";
import { prisma } from "@/config/database.js";
import { success } from "@/common/utils/response.js";
import { z } from "zod";

@Controller("/job", { tags: ["定时任务"] })
export default class JobController extends BaseController<any, any, any, any> {
  protected readonly repository = new JobRepository();
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
  protected readonly querySchema = z.object({});

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
    await prisma.sys_job.update({
      where: { job_id: req.params.id },
      data: { status },
    });
    if (status === "1") {
      const job = await prisma.sys_job.findUnique({
        where: { job_id: req.params.id },
      });
      if (job) startJob(job);
    } else {
      stopJob(req.params.id);
    }
    success(res, null, status === "1" ? "已启动" : "已停止");
  }

  @Post("/:id/run")
  @ApiOperation("立即执行")
  async runOnce(@Req() req: Request, @Res() res: Response) {
    await runJobOnce(req.params.id);
    success(res, null, "已执行");
  }

  @Get("/log/list")
  @ApiOperation("任务日志")
  async logList(@Req() req: Request, @Res() res: Response) {
    const data = await (this.repository as JobRepository).findLogPage({
      pageNum: Number(req.query.pageNum) || 1,
      pageSize: Number(req.query.pageSize) || 10,
      jobId: req.query.jobId,
      status: req.query.status,
    });
    success(res, data);
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
}
