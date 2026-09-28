import {
  Controller,
  Get,
  Req,
  Res,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base/controller.js";
import { success } from "@/shared/http/response.js";
import { ApprovalLogRepository } from "../repository/log.repository.js";
import { ApprovalLogService } from "../service/log.service.js";
import { ApprovalLogQuerySchema } from "../schema.js";
import { ZodType } from "zod/v4";
import { $ZodTypeInternals } from "zod/v4/core";

@Controller("/approval/log", { tags: ["审批日志"] })
export default class ApprovalLogController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new ApprovalLogRepository();
  protected readonly service = new ApprovalLogService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/approval/log",
    tags: ["审批日志"],
    permissionPrefix: "approval:log",
    enableAudit: true,
    defaultPageSize: 20,
    maxPageSize: 100,
  };
  protected readonly querySchema = ApprovalLogQuerySchema;
  protected readonly createSchema?: ZodType<
    unknown,
    unknown,
    $ZodTypeInternals<unknown, unknown>
  >;
  protected readonly updateSchema?: ZodType<
    unknown,
    unknown,
    $ZodTypeInternals<unknown, unknown>
  >;

  @Get("/list")
  @ApiOperation("审批日志列表")
  @ApiResponse(200, "查询成功")
  @ApiQuery({ name: "title", required: false, description: "申请标题" })
  @ApiQuery({ name: "action", required: false, description: "操作类型" })
  @ApiQuery({ name: "operatorName", required: false, description: "操作人" })
  async logList(@Req() req: Request, @Res() res: Response) {
    const dto = ApprovalLogQuerySchema.parse(req.query);
    const data = await this.service.getLogPage(dto, req.tenantId!);
    return success(res, data);
  }
}
