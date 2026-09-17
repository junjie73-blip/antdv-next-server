import {
  Controller,
  Get,
  Delete,
  Req,
  Res,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { JobRepository } from "./repository.js";
import { JobLogRepository } from "./job-log.repository.js";
import { JobService } from "./service.js";
import { error, success } from "@/common/utils/response.js";
import { z } from "zod";
import { AppError } from "@/core/errors.js";
import { logger } from "@/core/logger/logger.js";

/**
 * 任务日志 Controller
 * 路径：/api/v1/job-log
 */
@Controller("/job-log", { tags: ["定时任务日志"] })
export default class JobLogController {
  private jobRepo = new JobRepository();
  private logRepo = new JobLogRepository();
  private service = new JobService(this.jobRepo, this.logRepo);

  @Get("/list")
  @ApiOperation("任务日志列表")
  @ApiQuery(
    z.object({
      pageNum: z.number().default(1),
      pageSize: z.number().default(10),
      jobId: z.string().optional(),
      status: z.string().optional(),
    }),
  )
  @ApiResponse(200, "查询成功")
  async logList(@Req() req: Request, @Res() res: Response) {
    try {
      const pageNum = Number(req.query.pageNum) || 1;
      const pageSize = Number(req.query.pageSize) || 10;
      const jobId = req.query.jobId as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await this.service.findLogPage(
        { pageNum, pageSize, jobId, status },
        req.tenantId!,
      );
      success(res, result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Delete("/clear")
  @ApiOperation("清空日志")
  @ApiQuery(
    z.object({
      jobId: z.string().optional(),
    }),
  )
  @ApiResponse(200, "已清空")
  async clearLogs(@Req() req: Request, @Res() res: Response) {
    try {
      const jobId = req.query.jobId as string | undefined;
      const count = await this.service.clearLogs(req.tenantId!, jobId);
      success(res, { deletedCount: count }, "已清空");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[JobLog] error");
    error(res, "操作失败", 500, 500);
  }
}
