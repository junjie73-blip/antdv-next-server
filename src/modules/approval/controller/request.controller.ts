import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base/controller.js";
import { success } from "@/shared/http/response.js";
import { pushAudit } from "@/platform/audit/queue.js";
import { ApprovalRequestRepository } from "../repository/request.repository.js";
import { ApprovalRequestService } from "../service/request.service.js";
import {
  CreateApprovalSchema,
  ApproveSchema,
  RejectSchema,
} from "../schema.js";
import { ZodType } from "zod";
import { $ZodTypeInternals } from "zod/v4/core";

interface AuthUser {
  userId: string;
  tenantId: string;
  username?: string;
}

function buildAudit(
  req: Request,
  startTime: number,
  status: string,
  operation: string,
  responseData: Record<string, unknown> | null = null,
  errorMsg: string | null = null,
) {
  const user = req.user as AuthUser;
  const safeParams = { ...(req.body as Record<string, unknown>) };
  const sensitive = [
    "password",
    "oldPassword",
    "newPassword",
    "confirmPassword",
    "token",
    "secret",
  ];
  for (const f of sensitive) {
    if (safeParams[f]) safeParams[f] = "***";
  }
  return {
    tenantId: user.tenantId,
    userId: user.userId,
    username: user.username ?? null,
    operation,
    method: req.method,
    requestUrl: req.originalUrl,
    requestParams: safeParams,
    responseData,
    ipAddress: req.ip || "0.0.0.0",
    userAgent: req.headers["user-agent"] ?? null,
    executeTime: Date.now() - startTime,
    status,
    errorMsg,
  };
}

@Controller("/approval/request", { tags: ["审批请求"] })
export default class ApprovalRequestController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new ApprovalRequestRepository();
  protected readonly service = new ApprovalRequestService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/approval/request",
    tags: ["审批请求"],
    permissionPrefix: "approval:request",
    enableAudit: true,
    defaultPageSize: 20,
    maxPageSize: 100,
  };
  protected readonly createSchema = CreateApprovalSchema;
  protected readonly updateSchema = CreateApprovalSchema;
  @Post("/")
  @ApiOperation("提交审批申请")
  @ApiBody(CreateApprovalSchema)
  @ApiResponse(200, "提交成功")
  async submit(@Req() req: Request, @Res() res: Response) {
    const start = Date.now();
    const { userId, tenantId } = req.user as AuthUser;
    const dto = CreateApprovalSchema.parse(req.body);
    try {
      const result = await this.service.createRequest(userId, tenantId, dto);
      await pushAudit(
        buildAudit(req, start, "1", "提交审批申请", {
          requestId: result.request_id,
        }),
      );
      return success(res, result, "提交成功");
    } catch (err) {
      await pushAudit(
        buildAudit(
          req,
          start,
          "0",
          "提交审批申请",
          null,
          err instanceof Error ? err.message : "未知错误",
        ),
      );
      throw err;
    }
  }

  @Post("/:id/approve")
  @ApiOperation("审批通过")
  @ApiBody(ApproveSchema)
  async approve(@Req() req: Request, @Res() res: Response) {
    const start = Date.now();
    const { userId, tenantId } = req.user as AuthUser;
    const dto = ApproveSchema.parse(req.body);
    try {
      await this.service.approveRequest(req.params.id, userId, tenantId, dto);
      await pushAudit(buildAudit(req, start, "1", "审批通过"));
      return success(res, null, "审批已通过");
    } catch (err) {
      await pushAudit(
        buildAudit(
          req,
          start,
          "0",
          "审批通过",
          null,
          err instanceof Error ? err.message : "未知错误",
        ),
      );
      throw err;
    }
  }

  @Post("/:id/reject")
  @ApiOperation("审批驳回")
  @ApiBody(RejectSchema)
  async reject(@Req() req: Request, @Res() res: Response) {
    const start = Date.now();
    const { userId, tenantId } = req.user as AuthUser;
    const dto = RejectSchema.parse(req.body);
    try {
      await this.service.rejectRequest(req.params.id, userId, tenantId, dto);
      await pushAudit(buildAudit(req, start, "1", "审批驳回"));
      return success(res, null, "已驳回");
    } catch (err) {
      await pushAudit(
        buildAudit(
          req,
          start,
          "0",
          "审批驳回",
          null,
          err instanceof Error ? err.message : "未知错误",
        ),
      );
      throw err;
    }
  }

  @Post("/:id/resubmit")
  @ApiOperation("重新提交审批")
  @ApiBody(CreateApprovalSchema)
  async resubmit(@Req() req: Request, @Res() res: Response) {
    const start = Date.now();
    const { userId, tenantId } = req.user as AuthUser;
    const dto = CreateApprovalSchema.parse(req.body);
    try {
      await this.service.resubmitRequest(req.params.id, userId, tenantId, dto);
      await pushAudit(buildAudit(req, start, "1", "重新提交审批"));
      return success(res, null, "重新提交成功");
    } catch (err) {
      await pushAudit(
        buildAudit(
          req,
          start,
          "0",
          "重新提交审批",
          null,
          err instanceof Error ? err.message : "未知错误",
        ),
      );
      throw err;
    }
  }

  @Get("/tasks")
  @ApiOperation("待办审批列表")
  async tasks(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const data = await this.service.getTasks(userId, tenantId);
    return success(res, data);
  }
}
