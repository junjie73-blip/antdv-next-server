import {
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
  Delete,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { BaseController } from "@/core/base/controller.js";
import { UserRepository } from "./repository.js";
import {
  UserCreateSchema,
  UserUpdateSchema,
  UserListSchema,
  UserCreateDto,
} from "./schema.js";
import { z } from "zod";
import multer from "multer";
import { AppError } from "@/middleware/http/error-handler.js";
import { success } from "@/shared/http/response.js";
import { RequirePermission } from "@/core/decorator/permission.js";
import { prisma } from "@/config/database.js";
import { encrypt } from "@/core/security/crypto.js";

import { getClientIp } from "@/shared/utils/ip.js";
import { logger } from "@/platform/logger/logger.js";
import { UserService } from "./service.js";
import { hashField, maskPhone, maskEmail, decryptField } from "@/core/index.js";
import { writeAuditLog } from "@/platform/audit/writer.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller("/user", { tags: ["用户管理"] })
export default class UserController extends BaseController<any, any, any, any> {
  protected readonly repository = new UserRepository();
  protected readonly service = new UserService(this.repository);
  protected readonly config = {
    routePrefix: "/api/v1/user",
    tags: ["用户管理"],
    permissionPrefix: "user",
    enableAudit: true,
    defaultPageSize: 10,
    maxPageSize: 100,
    hiddenFields: ["password"],
  };
  protected readonly createSchema = UserCreateSchema;
  protected readonly updateSchema = UserUpdateSchema;
  protected readonly querySchema = UserListSchema;
  async beforeUpdate(id: string, dto: any, req: Request): Promise<any> {
    dto = await super.beforeUpdate(id, dto, req);
    const repo = this.repository as UserRepository;

    // 仅当用户名被修改时才检查唯一性
    if (dto.username) {
      const exist = await repo.findUserByUsername(
        dto.username,
        req.tenantId!,
        id,
      );
      if (exist) {
        throw new AppError(`用户名 '${dto.username}' 已存在`, 409, 409);
      }
    }
    return dto;
  }
  protected buildListWhere(query: any): any {
    const where: any = {};
    if (query.keyword) {
      const hash = hashField(query.keyword);
      where.OR = [
        { username: { contains: query.keyword } },
        { real_name: { contains: query.keyword } },
        { phone: { contains: hash } },
        { email: { contains: hash } },
      ];
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.ids) {
      where.user_id = { in: query.ids.split(",") };
    }
    return where;
  }
  async afterDetail(data, req) {
    const result = await super.afterDetail(data, req);
    if (result.phone) result.phone = maskPhone(result.phone);
    if (result.email) result.email = maskEmail(result.email);
    return result;
  }
  async afterList(data: any[], _req: Request): Promise<any[]> {
    return data.map((item) => ({
      ...item,
      phone: maskPhone(item.phone),
      email: maskEmail(item.email),
    }));
  }
  async beforeCreate(dto: UserCreateDto, req: Request): Promise<UserCreateDto> {
    // 调用父类方法（通常直接返回 dto，可不调用）
    dto = await super.beforeCreate(dto, req);

    const tenantId = req.tenantId!;
    // 检查用户名是否已存在
    const existing = await (
      this.repository as UserRepository
    ).findUserByUsername(dto.username, tenantId);
    if (existing) {
      throw new AppError(`用户名 '${dto.username}' 已存在`, 409, 409);
    }

    return dto;
  }
  // ========== CRUD 路由 ==========
  @Get("/list")
  @ApiOperation("获取用户分页列表")
  @ApiQuery(UserListSchema)
  @ApiResponse(200, "查询成功")
  async pageList(@Req() req: Request, @Res() res: Response) {
    return this.list(req, res);
  }

  @Get("/detail/:id")
  @ApiOperation("获取用户详情")
  @ApiResponse(200, "查询成功")
  async getDetail(@Req() req: Request, @Res() res: Response) {
    return this.detail(req, res);
  }

  @Post("/")
  @ApiOperation("创建用户")
  @ApiBody(UserCreateSchema)
  @ApiResponse(200, "创建成功")
  async createUser(@Req() req: Request, @Res() res: Response) {
    return this.create(req, res);
  }

  @Post("/update/:id")
  @ApiOperation("更新用户")
  @ApiBody(UserUpdateSchema)
  @ApiResponse(200, "更新成功")
  async updateUser(@Req() req: Request, @Res() res: Response) {
    return this.update(req, res);
  }

  @Delete("/remove/:id")
  @ApiOperation("删除用户")
  @ApiResponse(200, "删除成功")
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    return this.remove(req, res);
  }

  @Post("/batch-delete")
  @ApiOperation("批量删除用户")
  @ApiBody(z.object({ ids: z.array(z.string().uuid()).min(1) }))
  @ApiResponse(200, "批量删除成功")
  async batchDeleteUser(@Req() req: Request, @Res() res: Response) {
    return super.batchRemove(req, res);
  }

  // ========== 导入导出（已下沉到 Repository） ==========

  @Get("/export")
  @ApiOperation("导出用户", "根据筛选条件导出Excel")
  @ApiQuery(
    UserListSchema.pick({
      keyword: true,
      status: true,
      roleId: true,
      deptId: true,
    }),
  )
  @ApiResponse(200, "Excel文件")
  async exportUsers(@Req() req: Request, @Res() res: Response) {
    try {
      const where = this.buildListWhere(req.query);
      const buffer = await this.service.exportToExcel(where, req.tenantId!);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=users_${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Post("/import")
  @ApiOperation("导入用户", "上传Excel批量导入")
  @ApiResponse(200, "导入结果")
  async importUsers(@Req() req: Request, @Res() res: Response) {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        return this.handleError(
          res,
          new AppError("文件上传失败：仅支持 .xlsx 且 ≤5MB", 400, 400),
        );
      }
      try {
        if (!req.file) throw new AppError("请上传Excel文件", 400, 400);
        const result = await this.service.importFromExcel(
          req.file.buffer,
          req.tenantId!,
          req.user?.userId,
        );
        success(res, result, "导入完成");
      } catch (err) {
        this.handleError(res, err);
      }
    });
  }

  @Get("/:id/roles")
  @ApiOperation("获取用户角色", "获取用户关联的角色列表")
  @ApiResponse(200, "查询成功")
  async getUserRoles(@Req() req: Request, @Res() res: Response) {
    try {
      const roles = await (this.repository as UserRepository).findUserRoles(
        req.params.id,
        req.tenantId!,
      );
      success(res, roles, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Put("/:id/depts")
  @ApiOperation("更新用户部门", "批量设置用户的部门列表")
  @ApiBody(z.object({ deptIds: z.array(z.string().uuid()) }))
  @ApiResponse(200, "更新成功")
  async updateUserDepts(@Req() req: Request, @Res() res: Response) {
    try {
      const { deptIds } = req.body;
      await (this.repository as UserRepository).updateUserDepts(
        req.params.id,
        deptIds,
        req.tenantId!,
      );
      success(res, null, "更新成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Get("/:id/depts")
  @ApiOperation("获取用户部门", "获取用户关联的部门列表")
  @ApiResponse(200, "查询成功")
  async getUserDepts(@Req() req: Request, @Res() res: Response) {
    try {
      const depts = await (this.repository as UserRepository).findUserDepts(
        req.params.id,
        req.tenantId!,
      );
      success(res, depts, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
  @Put("/:id/password")
  @ApiOperation("重置用户密码")
  @ApiBody(z.object({ password: z.string().min(6).max(64) }))
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    try {
      const { password } = req.body;
      await this.service.resetPassword(
        req.params.id,
        req.body.password,
        req.tenantId!,
      );
      success(res, null, "密码重置成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  @Put("/:id/roles")
  async updateUserRoles(@Req() req, @Res() res) {
    await this.service.updateRoles(
      req.params.id,
      req.body.roleIds,
      req.tenantId!,
    );
    success(res, null, "更新成功");
  }
  @Get("/options")
  @ApiOperation("获取角色选项", "返回启用状态的角色列表")
  @ApiResponse(200, "查询成功")
  async options(@Req() req: Request, @Res() res: Response) {
    const roles = await prisma.sys_role.findMany({
      where: { tenant_id: req.tenantId!, status: "1", is_deleted: 0 },
      select: { role_id: true, role_name: true },
    });
    success(
      res,
      roles.map((r) => ({ label: r.role_name, value: r.role_id })),
    );
  }
  /**
   * 获取全部用户选项（用于下拉选择）
   * 返回字段：{ userId, username }
   */
  @Get("/all/options")
  @ApiOperation("获取用户选项", "返回全部启用用户的 ID 和用户名")
  @ApiResponse(200, "查询成功")
  async useroOtions(@Req() req: Request, @Res() res: Response) {
    const users = await prisma.sys_user.findMany({
      where: {
        tenant_id: req.tenantId!,
        status: "1", // 只返回启用用户
        is_deleted: 0,
      },
      select: {
        user_id: true,
        username: true,
        real_name: true, // 可选，若需要显示姓名
      },
      orderBy: { username: "asc" },
    });

    // 转换为前端需要的格式
    const options = users.map((user) => ({
      userId: user.user_id,
      username: user.username,
      realName: user.real_name || user.username,
      label: user.real_name || user.username, // 显示名称
      value: user.user_id, // 值
    }));

    success(res, options);
  }
  @Get("/:id/sensitive")
  @ApiOperation(
    "查看用户敏感信息",
    "返回解密后的手机号、身份证号等敏感字段。需要 user:view-sensitive 权限，且每次调用都会记录审计日志",
  )
  @ApiResponse(200, "查询成功")
  @ApiResponse(403, "无权限")
  @ApiResponse(404, "用户不存在")
  async getSensitive(@Req() req, @Res() res) {
    try {
      const targetUserId = req.params.id;
      const tenantId = req.tenantId!;
      const operatorId = req.user!.userId;
      const operatorName = req.user!.username;
      const startAt = Date.now();

      // 1) 校验目标用户归属当前租户
      const user = await prisma.sys_user.findFirst({
        where: {
          user_id: targetUserId,
          tenant_id: tenantId,
          is_deleted: 0,
        },
        select: {
          user_id: true,
          username: true,
          real_name: true,
          phone: true,
          phone_enc: true,
          email: true,
          id_card_enc: true,
        },
      });
      if (!user) {
        throw new AppError("用户不存在", 404001, 404);
      }

      // 2) 解密敏感字段
      let plainPhone: string | null = null;
      try {
        if (user.phone_enc) {
          plainPhone = decryptField(user.phone_enc);
        } else if (user.phone) {
          // 兼容尚未迁移的历史数据（明文存储）
          plainPhone = user.phone;
        }
      } catch (err) {
        logger.error(
          { err, userId: targetUserId },
          "[getSensitive] decrypt phone failed",
        );
        throw new AppError("敏感数据解密失败", 500001, 500);
      }

      let plainIdCard: string | null = null;
      if (user.id_card_enc) {
        try {
          plainIdCard = decryptField(user.id_card_enc);
        } catch (err) {
          logger.error(
            { err, userId: targetUserId },
            "[getSensitive] decrypt id_card failed",
          );
          // 身份证解密失败不阻断，返回 null 由前端展示
          plainIdCard = null;
        }
      }

      const result = {
        userId: user.user_id,
        username: user.username,
        realName: user.real_name,
        phone: plainPhone,
        idCard: plainIdCard,
        email: user.email,
      };

      // 3) 写审计日志（异步队列，不阻塞响应）
      await writeAuditLog({
        tenantId,
        userId: operatorId,
        username: operatorName,
        operation: "view_sensitive_user_data",
        method: req.method,
        requestUrl: req.originalUrl,
        requestParams: { targetUserId },
        responseData: {
          // 审计里也不存明文，只标记查了哪些字段
          queriedFields: ["phone", "idCard", "email"],
        },
        ipAddress: getClientIp(req) || "unknown",
        userAgent: req.headers["user-agent"] || "",
        executeTime: Date.now() - startAt,
        status: "1",
      });

      success(res, result, "查询成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
