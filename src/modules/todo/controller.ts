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
  ApiQuery,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { TodoRepository } from "./repository.js";
import { success } from "@/common/utils/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { z } from "zod";

// 模块级 Schema
const TodoCreateSchema = z.object({
  title: z.string().min(1).max(256),
  content: z.string().optional(),
  priority: z.number().int().min(0).max(2).default(0),
  dueTime: z.string().datetime().nullable().optional(),
});
const TodoUpdateSchema = TodoCreateSchema.partial();

@Controller("/todo", { tags: ["待办事项"] })
export default class TodoController extends BaseController<any, any, any, any> {
  protected readonly repository = new TodoRepository();
  protected readonly config = {
    routePrefix: "/api/v1/todo",
    tags: ["待办事项"],
    permissionPrefix: "message:todo",
    enableAudit: true,
    defaultPageSize: 20,
    maxPageSize: 100,
  };
  protected readonly createSchema = TodoCreateSchema;
  protected readonly updateSchema = TodoUpdateSchema;
  protected readonly querySchema = z.object({});

  protected buildListWhere() {
    return {};
  }

  // ✅ 重点：装饰器必须写，且 res 参数要带 @Res()
  @Get("/list")
  @ApiOperation("待办列表")
  @ApiResponse(200, "查询成功")
  async todoList(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await (this.repository as TodoRepository).findPage(
        {
          ...req.query,
          tenantId: req.tenantId,
          userId: req.user?.userId,
        },
        {},
      );
      success(res, data);
    } catch (err) {
      // 使用基类或手动返回错误
      return this.handleError(res, err);
    }
  }

  @Get("/stats")
  @ApiOperation("待办统计")
  async stats(@Req() req: Request, @Res() res: Response) {
    try {
      const data = await (this.repository as TodoRepository).stats(
        req.user!.userId,
        req.tenantId!,
      );
      success(res, data);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/")
  @ApiOperation("创建待办")
  @ApiBody(TodoCreateSchema)
  async todoCreate(@Req() req: Request, @Res() res: Response) {
    return super.create(req, res);
  }

  @Put("/:id")
  @ApiOperation("更新待办")
  @ApiBody(TodoUpdateSchema)
  async todoUpdate(@Req() req: Request, @Res() res: Response) {
    return super.update(req, res);
  }

  @Delete("/:id")
  @ApiOperation("删除待办")
  async todoRemove(@Req() req: Request, @Res() res: Response) {
    return super.remove(req, res);
  }

  @Put("/:id/complete")
  @ApiOperation("完成待办")
  async todoComplete(@Req() req: Request, @Res() res: Response) {
    try {
      await (this.repository as TodoRepository).complete(
        req.params.id,
        req.tenantId!,
      );
      success(res, null, "已完成");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
