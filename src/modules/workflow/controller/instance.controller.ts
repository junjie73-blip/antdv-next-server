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
import { WfInstanceService } from "../service/instance.service.js";
import { workflowEngine } from "../service/engine.js";
import {
  WfStartInstanceSchema,
  WfInstanceListSchema,
  WfTerminateSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/instance", { tags: ["工作流-实例"] })
export default class WfInstanceController {
  private service = new WfInstanceService();

  @Post("/start")
  @RequirePermission("workflow:center:initiated")
  @ApiOperation("发起流程")
  @ApiBody(WfStartInstanceSchema)
  async start(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = WfStartInstanceSchema.parse(req.body);

    const instance = await workflowEngine.start({
      tenantId,
      defKey: dto.defKey,
      title: dto.title,
      businessKey: dto.businessKey,
      variables: dto.variables,
      initiatorId: userId,
    });

    return success(res, instance, "发起成功");
  }

  @Get("/list")
  @RequirePermission("workflow:center:initiated")
  @ApiOperation("流程实例列表")
  @ApiQuery(WfInstanceListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = WfInstanceListSchema.parse(req.query);

    const result = await this.service.list({
      tenantId,
      initiatorId: dto.initiatorId ?? userId,
      defKey: dto.defKey,
      status: dto.status,
      keyword: dto.keyword,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
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
  @ApiOperation("流程实例详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.detail(req.params.id, tenantId);
    return success(res, data);
  }

  @Get("/:id/history")
  @ApiOperation("流程历史")
  async history(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.history(req.params.id, tenantId);
    return success(res, data);
  }

  @Get("/:id/diagram")
  @ApiOperation("流程图（带状态）")
  async diagram(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.diagram(req.params.id, tenantId);
    return success(res, data);
  }

  @Post("/:id/suspend")
  @ApiOperation("挂起流程")
  async suspend(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.suspend(req.params.id, tenantId, userId);
    return success(res, null, "已挂起");
  }

  @Post("/:id/resume")
  @ApiOperation("恢复流程")
  async resume(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.resume(req.params.id, tenantId, userId);
    return success(res, null, "已恢复");
  }

  @Post("/:id/terminate")
  @ApiOperation("终止流程")
  @ApiBody(WfTerminateSchema)
  async terminate(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = WfTerminateSchema.parse(req.body);
    await this.service.terminate(req.params.id, tenantId, userId, dto.reason);
    return success(res, null, "已终止");
  }
}
