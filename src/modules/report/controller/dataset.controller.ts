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
import { RpDatasetService } from "../service/dataset.service.js";
import {
  DatasetCreateSchema,
  DatasetUpdateSchema,
  DatasetListSchema,
  DatasetTestSchema,
} from "../schema.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/report/dataset", { tags: ["报表-数据集"] })
export default class DatasetController {
  private service = new RpDatasetService();

  @Get("/list")
  @ApiOperation("数据集列表")
  @ApiQuery(DatasetListSchema)
  async list(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const dto = DatasetListSchema.parse(req.query);

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

  @Get("/:id")
  @ApiOperation("数据集详情")
  async detail(@Req() req: Request, @Res() res: Response) {
    const { tenantId } = req.user as AuthUser;
    const data = await this.service.detail(req.params.id, tenantId);
    return success(res, data);
  }

  @Post("/")
  @ApiOperation("创建数据集")
  @ApiBody(DatasetCreateSchema)
  async create(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = DatasetCreateSchema.parse(req.body);
    const created = await this.service.create(dto, tenantId, userId);
    return success(res, created, "创建成功");
  }

  @Put("/:id")
  @ApiOperation("更新数据集")
  @ApiBody(DatasetUpdateSchema)
  async update(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = DatasetUpdateSchema.parse(req.body);
    await this.service.update(req.params.id, dto, tenantId, userId);
    return success(res, null, "更新成功");
  }

  @Delete("/:id")
  @ApiOperation("删除数据集")
  async remove(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    await this.service.remove(req.params.id, tenantId, userId);
    return success(res, null, "删除成功");
  }

  @Post("/:id/test")
  @ApiOperation("测试执行数据集")
  @ApiBody(DatasetTestSchema)
  async test(@Req() req: Request, @Res() res: Response) {
    const { userId, tenantId } = req.user as AuthUser;
    const dto = DatasetTestSchema.parse(req.body);

    const result = await this.service.test(
      req.params.id,
      tenantId,
      userId,
      dto.params,
      dto.limit,
    );

    return success(res, result);
  }
}
