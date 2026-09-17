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
  ApiResponse,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { TodoGroupRepository } from "./repository.js";
import { TodoGroupCreateSchema, TodoGroupUpdateSchema } from "./schema.js";
import { AppError } from "@/core/errors.js";
import { error, success } from "@/common/utils/response.js";
import { logger } from "@core/logger/index.js";
import { keysToCamelCase } from "@/common/utils/case-convert.js";

@Controller("/todo-group", { tags: ["待办分组"] })
export default class TodoGroupController {
  private repository = new TodoGroupRepository();

  /** 统一取出当前用户上下文 */
  private getUserContext(req: Request): { userId: string; tenantId: string } {
    const userId = req.user?.userId;
    const tenantId = req.tenantId;
    if (!userId) throw new AppError("未认证", 401001, 401);
    if (!tenantId) throw new AppError("缺少租户上下文", 401001, 401);
    return { userId, tenantId };
  }

  // ============================================================
  // 列表（不分页，用户的分组数量有限）
  // ============================================================
  @Get("/list")
  @ApiOperation("获取我的分组列表", "返回当前用户的全部分组，按 sortOrder 升序")
  @ApiResponse(200, "查询成功")
  async list(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getUserContext(req);
      const groups = await this.repository.findByUser(userId, tenantId);
      success(res, groups.map(keysToCamelCase));
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 详情
  // ============================================================
  @Get("/:id")
  @ApiOperation("获取分组详情")
  @ApiResponse(200, "查询成功")
  @ApiResponse(404, "分组不存在")
  async detail(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getUserContext(req);
      const group = await this.repository.findOneForUser(
        req.params.id,
        userId,
        tenantId,
      );
      if (!group) throw new AppError("分组不存在", 404001, 404);
      success(res, group);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 创建
  // ============================================================
  @Post("/")
  @ApiOperation("创建分组")
  @ApiBody(TodoGroupCreateSchema)
  @ApiResponse(200, "创建成功")
  @ApiResponse(409, "分组名称已存在")
  async create(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getUserContext(req);
      const dto = TodoGroupCreateSchema.parse(req.body);

      // 同用户下名称唯一
      const existing = await this.repository.findByName(
        dto.name,
        userId,
        tenantId,
      );
      if (existing) {
        throw new AppError(`分组「${dto.name}」已存在`, 409001, 409);
      }

      const group = await this.repository.createForUser(dto, userId, tenantId);
      success(res, group, "创建成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 更新
  // ============================================================
  @Put("/:id")
  @ApiOperation("更新分组")
  @ApiBody(TodoGroupUpdateSchema)
  @ApiResponse(200, "更新成功")
  @ApiResponse(404, "分组不存在")
  @ApiResponse(409, "分组名称已存在")
  async update(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getUserContext(req);
      const dto = TodoGroupUpdateSchema.parse(req.body);

      // 改名时检查重复
      if (dto.name) {
        const existing = await this.repository.findByName(
          dto.name,
          userId,
          tenantId,
          req.params.id,
        );
        if (existing) {
          throw new AppError(`分组「${dto.name}」已存在`, 409001, 409);
        }
      }

      const group = await this.repository.updateForUser(
        req.params.id,
        dto,
        userId,
        tenantId,
      );
      success(res, group, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 删除
  // ============================================================
  @Delete("/:id")
  @ApiOperation("删除分组", "分组下有未删除待办时不允许删除")
  @ApiResponse(200, "删除成功")
  @ApiResponse(400, "分组下存在待办")
  @ApiResponse(404, "分组不存在")
  async remove(@Req() req: Request, @Res() res: Response) {
    try {
      const { userId, tenantId } = this.getUserContext(req);
      await this.repository.softDeleteForUser(req.params.id, userId, tenantId);
      success(res, null, "删除成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  // ============================================================
  // 错误处理
  // ============================================================
  private handleError(res: Response, err: unknown): void {
    if (err instanceof AppError) {
      error(res, err.message, err.statusCode);
      return;
    }
    logger.error({ err }, "TodoGroupController error");
    error(res, "操作失败", 5000);
  }
}
