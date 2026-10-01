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
import { workflowCenterFacade } from "../service/facade.service.js";
import {
  CenterTodoQuerySchema,
  CenterCompleteSchema,
  CenterBatchCompleteSchema,
  CenterDetailQuerySchema,
  CenterInitiatedQuerySchema,
  CenterDoneQuerySchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/center", { tags: ["流程中心"] })
export default class WorkflowCenterController {
  private facade = workflowCenterFacade;

  @Get("/todo")
  @ApiOperation("统一待办列表")
  @ApiQuery(CenterTodoQuerySchema)
  async todo(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = CenterTodoQuerySchema.parse(req.query);

    const result = await this.facade.listTodo(dto, userId, tenantId);
    return pageSuccess(
      res,
      result.list,
      result.total,
      dto.pageNum,
      dto.pageSize,
    );
  }

  @Post("/complete")
  @ApiOperation("完成待办（统一入口）")
  @ApiBody(CenterCompleteSchema)
  async complete(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = CenterCompleteSchema.parse(req.body);

    const result = await this.facade.complete(dto, userId, tenantId);
    return success(
      res,
      result,
      dto.action === "approve" ? "审批通过" : "已驳回",
    );
  }

  @Post("/batch-complete")
  @ApiOperation("批量完成待办")
  @ApiBody(CenterBatchCompleteSchema)
  async batchComplete(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = CenterBatchCompleteSchema.parse(req.body);

    const result = await this.facade.batchComplete(dto, userId, tenantId);
    return success(
      res,
      result,
      `成功 ${result.success} 个，失败 ${result.failed} 个`,
    );
  }

  @Get("/detail/:source/:id")
  @ApiOperation("流程详情（统一入口）")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const dto = CenterDetailQuerySchema.parse({
      source: req.params.source,
      id: req.params.id,
    });

    const result = await this.facade.getDetail(dto, tenantId);
    return success(res, result);
  }
  @Get("/initiated")
  @ApiOperation("我发起的")
  @ApiQuery(CenterInitiatedQuerySchema)
  async initiated(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = CenterInitiatedQuerySchema.parse(req.query);

    const result = await this.facade.listInitiated(dto, userId, tenantId);
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
  @ApiQuery(CenterDoneQuerySchema)
  async done(@Req() req: Request, @Res() res: Response) {
    const { tenantId, userId } = req.user as AuthUser;
    const dto = CenterDoneQuerySchema.parse(req.query);

    const result = await this.facade.listDone(dto, userId, tenantId);
    return pageSuccess(
      res,
      result.list,
      result.total,
      dto.pageNum,
      dto.pageSize,
    );
  }
}
