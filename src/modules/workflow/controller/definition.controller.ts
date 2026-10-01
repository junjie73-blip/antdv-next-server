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
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, pageSuccess } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { WfDefinitionService } from "../service/definition.service.js";
import {
  WfDefinitionCreateSchema,
  WfDefinitionUpdateSchema,
  WfDefinitionListSchema,
  WfValidateBpmnSchema,
  WfImportXmlSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/workflow/definition", { tags: ["工作流-定义"] })
export default class WfDefinitionController {
  private service = new WfDefinitionService();

  /* ============================================================
   * 列表
   * ============================================================ */
  @Get("/list")
  @ApiOperation("流程定义列表")
  @ApiQuery(WfDefinitionListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const dto = WfDefinitionListSchema.parse(req.query);

    const result = await this.service.list({
      tenantId,
      keyword: dto.keyword,
      category: dto.category,
      status: dto.status,
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

  /* ============================================================
   * 详情（含 BPMN JSON + XML）
   * ============================================================ */
  @Get("/:id")
  @ApiOperation("流程定义详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.detail(req.params.id, tenantId);
    return success(res, data);
  }

  /* ============================================================
   * 创建
   * ============================================================ */
  @Post("/")
  @ApiOperation("创建流程定义")
  @ApiBody(WfDefinitionCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = WfDefinitionCreateSchema.parse(req.body);
    const created = await this.service.create(dto, tenantId, userId);
    return success(res, created, "创建成功");
  }

  /* ============================================================
   * 更新
   * ============================================================ */
  @Put("/:id")
  @ApiOperation("更新流程定义")
  @ApiBody(WfDefinitionUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = WfDefinitionUpdateSchema.parse(req.body);
    await this.service.update(req.params.id, dto, tenantId, userId);
    return success(res, null, "更新成功");
  }

  /* ============================================================
   * 发布
   * ============================================================ */
  @Post("/:id/publish")
  @ApiOperation("发布流程")
  async publish(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.publish(req.params.id, tenantId, userId);
    return success(res, null, "发布成功");
  }

  /* ============================================================
   * 新建版本
   * ============================================================ */
  @Post("/:id/new-version")
  @ApiOperation("新建版本")
  async newVersion(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const created = await this.service.newVersion(
      req.params.id,
      tenantId,
      userId,
    );
    return success(res, created, "新版本已创建");
  }

  /* ============================================================
   * 删除
   * ============================================================ */
  @Delete("/:id")
  @ApiOperation("删除流程定义")
  async remove(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.remove(req.params.id, tenantId, userId);
    return success(res, null, "删除成功");
  }

  /* ============================================================
   * 编辑器专用：校验
   * ============================================================ */
  @Post("/validate")
  @ApiOperation("校验 BPMN 定义（不落库）")
  @ApiBody(WfValidateBpmnSchema)
  async validate(@Req() req: Request, @Res() res: Response) {
    const dto = WfValidateBpmnSchema.parse(req.body);
    const result = this.service.validate(dto.definition);
    return success(res, result, "校验通过");
  }

  /* ============================================================
   * 编辑器专用：导入 XML
   * ============================================================ */
  @Post("/import-xml")
  @ApiOperation("导入 BPMN XML")
  @ApiBody(WfImportXmlSchema)
  async importXml(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const dto = WfImportXmlSchema.parse(req.body);
    const result = await this.service.importXml(dto.xml, tenantId);
    return success(res, result, "导入成功");
  }
}
