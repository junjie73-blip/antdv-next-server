import { AppError, BaseController } from "@/core/index.js";
import { TemplateRepository } from "./repository.js";
import {
  RenderPreviewSchema,
  TemplateCreateSchema,
  TemplateListSchema,
  TemplateUpdateSchema,
  TestSendSchema,
} from "./schema.js";
import { Controller } from "@/core/decorator/controller.js";
import { Delete, Get, Post, Put } from "@/core/decorator/route.js";
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@/core/decorator/swagger.js";
import { Req, Res } from "@/core/decorator/validator.js";
import { Request, Response } from "express";
import { TemplateService } from "./service.js";
import { AuthUser } from "@/modules/auth/types.js";
import { success } from "@/shared/http/response.js";
import z from "zod";
@Controller("/notice/template", { tags: ["消息模板"] })
export default class TemplateController extends BaseController<
  any,
  any,
  any,
  any
> {
  protected readonly repository = new TemplateRepository();
  protected readonly service = new TemplateService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/notice/template",
    tags: ["消息模板"],
    permissionPrefix: "message:notice-template",
    enableAudit: true,
    defaultPageSize: 20,
    maxPageSize: 100,
  };
  protected readonly createSchema = TemplateCreateSchema;
  protected readonly updateSchema = TemplateUpdateSchema;
  protected readonly querySchema = TemplateListSchema;
  async beforeCreate(dto: any, req: Request): Promise<any> {
    dto = await super.beforeCreate(dto, req);
    if (dto.editorType === "richtext" && dto.contentFormat !== "html") {
      dto.contentFormat = "html";
    }
    return dto;
  }

  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    if (dto.editorType === "richtext") {
      dto.contentFormat = "html";
    }
    return dto;
  }
  @Get("/list")
  @ApiOperation("消息模板列表")
  @ApiQuery(TemplateListSchema)
  @ApiResponse(200, "查询成功")
  async templateListList(@Req() req: Request, @Res() res: Response) {
    return super.list(req, res);
  }
  @Get("/options")
  @ApiOperation("消息模板选项")
  @ApiResponse(200, "查询成功")
  async templateOptions(@Req() req: Request, @Res() res: Response) {
    try {
      const tenantId = (req.user as AuthUser)?.tenantId ?? req.tenantId;
      if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
      success(res, await this.service.renderOptions(tenantId)); // ✅
    } catch (err) {
      super.handleError(res, err);
    }
  }
  @Get("/:id")
  @ApiOperation("模板详情")
  async getDetail(@Req() req: Request, @Res() res: Response) {
    return super.detail(req, res);
  }
  @Delete("/:id")
  @ApiOperation("删除模板")
  async delete(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }
  @Post("/")
  @ApiOperation("新增模板")
  @ApiBody(TemplateCreateSchema)
  async createTemplate(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }
  @Put("/:id")
  @ApiOperation("更新模板")
  @ApiBody(TemplateUpdateSchema)
  async updateTemplate(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }
  @Post("/render-preview")
  @ApiOperation("渲染预览")
  @ApiBody(RenderPreviewSchema)
  async renderPreview(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = RenderPreviewSchema.parse(req.body);
      const data = await this.service.renderPreview({
        ...dto,
        editorType: (req.body as any).editorType,
      });
      return success(res, data);
    } catch (err) {
      super.handleError(res, err);
    }
  }

  @Delete("/batch/delete")
  @ApiOperation("批量删除")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()).min(1) }))
  async batchRemove(@Req() req: Request, @Res() res: Response) {
    return super.batchRemove(req, res);
  }
  @Post("/test-send")
  @ApiOperation("测试发送")
  @ApiBody(TestSendSchema)
  async testSend(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = req.user as AuthUser;
      const dto = TestSendSchema.parse(req.body);
      const result = await this.service.testSend(dto, tenantId, userId);
      return success(res, result, "测试发送成功");
    } catch (err) {
      super.handleError(res, err);
    }
  }
}
