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
import { NotFoundError } from "@/core/errors.js";
import { ApprovalRequestRepository } from "../repository/request.repository.js";
import { ApprovalFlowService } from "../service/flow.service.js";
import { ApprovalFlowQuerySchema } from "../schema.js";
import { ZodType } from "zod";
import { $ZodTypeInternals } from "zod/v4/core";

@Controller("/approval/flow", { tags: ["审批流程"] })
export default class ApprovalFlowController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new ApprovalRequestRepository();
  protected readonly service = new ApprovalFlowService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/approval/flow",
    tags: ["审批流程"],
    permissionPrefix: "approval:flow",
    enableAudit: true,
    defaultPageSize: 20,
    maxPageSize: 100,
  };
  protected readonly querySchema = ApprovalFlowQuerySchema;
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
  @ApiOperation("审批流程列表")
  @ApiResponse(200, "查询成功")
  @ApiQuery({ name: "title", required: false, description: "申请标题" })
  @ApiQuery({ name: "status", required: false, description: "状态 0/1/2/3" })
  async flowList(@Req() req: Request, @Res() res: Response) {
    const dto = ApprovalFlowQuerySchema.parse(req.query);
    const data = await this.service.getFlowPage(dto, req.tenantId!);
    return success(res, data);
  }

  @Get("/detail/:id")
  @ApiOperation("审批流程详情")
  @ApiResponse(200, "查询成功")
  async flowDetail(@Req() req: Request, @Res() res: Response) {
    const data = await this.service.getFlowDetail(req.params.id, req.tenantId!);
    if (!data) throw new NotFoundError("审批流程不存在");
    return success(res, data);
  }
}
