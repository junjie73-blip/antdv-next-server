import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { success, error } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { queueMonitorService } from "./service.js";
import { JOB_STATUS_LIST } from "./constants.js";

/* ============================================================
 * Zod schemas
 * ============================================================ */
const ListJobsSchema = z.object({
  status: z.enum(JOB_STATUS_LIST).default("failed"),
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  keyword: z.string().max(128).optional(),
});

const CleanSchema = z.object({
  status: z.enum(["completed", "failed", "delayed", "wait"]),
  limit: z.coerce.number().int().min(1).max(5000).default(1000),
});

@Controller("/monitor/queue", { tags: ["队列监控"] })
export default class QueueMonitorController {
  /* ============================================================
   * 概览
   * ============================================================ */
  @Get("/overview")
  @ApiOperation("队列概览", "返回所有 BullMQ 队列的计数、暂停状态、worker 数")
  async overview(@Req() _req: Request, @Res() res: Response) {
    try {
      const data = await queueMonitorService.overview();
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * Job 列表
   * ============================================================ */
  @Get("/:name/jobs")
  @ApiOperation("Job 列表", "按状态分页查询指定队列的 Job")
  @ApiQuery(ListJobsSchema)
  async listJobs(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = ListJobsSchema.parse(req.query);
      const data = await queueMonitorService.listJobs(req.params.name, {
        status: dto.status as any,
        pageNum: dto.pageNum,
        pageSize: dto.pageSize,
        keyword: dto.keyword,
      });
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * Job 详情
   * ============================================================ */
  @Get("/:name/job/:id")
  @ApiOperation("Job 详情")
  async jobDetail(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await queueMonitorService.getJobDetail(
        req.params.name,
        req.params.id,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 重试
   * ============================================================ */
  @Post("/:name/job/:id/retry")
  @ApiOperation("重试 Job", "将失败的 Job 重新放回等待队列")
  async retry(@Req() req: Request, @Res() res: Response) {
    try {
      await queueMonitorService.retryJob(req.params.name, req.params.id);
      success(res, null, "已重新入队");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  @Post("/:name/job/:id/remove")
  @ApiOperation("删除 Job")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      await queueMonitorService.removeJob(req.params.name, req.params.id);
      success(res, null, "已删除");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 暂停
   * ============================================================ */
  @Post("/:name/pause")
  @ApiOperation("暂停队列")
  async pause(@Req() req: Request, @Res() res: Response) {
    try {
      await queueMonitorService.pause(req.params.name);
      success(res, null, "已暂停");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 恢复
   * ============================================================ */
  @Post("/:name/resume")
  @ApiOperation("恢复队列")
  async resume(@Req() req: Request, @Res() res: Response) {
    try {
      await queueMonitorService.resume(req.params.name);
      success(res, null, "已恢复");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 清理
   * ============================================================ */
  @Post("/:name/clean")
  @ApiOperation("清理队列", "批量删除指定状态的 Job")
  @ApiBody(CleanSchema)
  async clean(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = CleanSchema.parse(req.body);
      const data = await queueMonitorService.clean(
        req.params.name,
        dto.status as any,
        dto.limit,
      );
      success(res, data, `已清理 ${data.removed} 条`);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  /* ============================================================
   * 错误处理
   * ============================================================ */
  private handleError(res: Response, err: unknown): void {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      error(res, err.message, err.code, err.statusCode);
      return;
    }
    logger.error({ err }, "[QueueMonitor] error");
    error(res, "操作失败", 500, 500);
  }
}
