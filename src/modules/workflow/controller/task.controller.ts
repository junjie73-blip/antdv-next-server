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
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { WfTaskService } from "../service/task.service.js";
import {
  WfCompleteTaskSchema,
  WfTaskListSchema,
  WfBatchCompleteSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/task", { tags: ["工作流-任务"] })
export default class WfTaskController {
  private service = new WfTaskService();

  @Get("/todo")
  @ApiOperation("我的待办")
  @ApiQuery(WfTaskListSchema)
  async todo(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = WfTaskListSchema.parse(req.query);

    const result = await this.service.todo({
      tenantId,
      userId,
      keyword: dto.keyword,
      defKey: dto.defKey,
      priority: dto.priority,
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

  @Get("/done")
  @ApiOperation("我的已办")
  @ApiQuery(WfTaskListSchema)
  async done(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = WfTaskListSchema.parse(req.query);

    const result = await this.service.done({
      tenantId,
      userId,
      keyword: dto.keyword,
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

  @Get("/:id")
  @ApiOperation("任务详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.detail(req.params.id, tenantId);
    return success(res, data);
  }

  @Post("/:id/complete")
  @ApiOperation("完成任务")
  @ApiBody(WfCompleteTaskSchema)
  async complete(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = WfCompleteTaskSchema.parse(req.body);

    const result = await this.service.complete(
      req.params.id,
      tenantId,
      userId,
      dto,
    );

    return success(
      res,
      result,
      dto.action === "approve" ? "审批通过" : "已驳回",
    );
  }

  @Post("/batch-complete")
  @ApiOperation("批量完成任务")
  @ApiBody(WfBatchCompleteSchema)
  async batchComplete(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = WfBatchCompleteSchema.parse(req.body);

    const result = await this.service.batchComplete(
      dto.taskIds,
      tenantId,
      userId,
      { action: dto.action, comment: dto.comment },
    );

    return success(
      res,
      result,
      `成功 ${result.success} 个，失败 ${result.failed} 个`,
    );
  }
}
