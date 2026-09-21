import {
  Controller,
  Post,
  Req,
  Res,
  ApiOperation,
  ApiBody,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { UserRepository } from "@/modules/user/repository.js";
import { RegisterSchema } from "../schema.js";

const RESERVED_TENANT_PREFIX = "__";

function assertTenantCodeAllowed(code: string): void {
  if (code.startsWith(RESERVED_TENANT_PREFIX)) {
    throw new AppError("租户编码不合法", 400001, 400);
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,62}$/.test(code)) {
    throw new AppError("租户编码格式不合法", 400001, 400);
  }
}

@Controller("/auth", { tags: ["认证"] })
export default class AuthRegisterController {
  private userRepository = new UserRepository();

  @Post("/register")
  @ApiOperation("用户注册")
  @ApiBody(RegisterSchema)
  async register(@Req() req: Request, @Res() res: Response) {
    try {
      const dto = RegisterSchema.parse(req.body);
      assertTenantCodeAllowed(dto.tenantCode);

      let tenant = await this.userRepository.findTenantByCode(dto.tenantCode);
      if (!tenant) {
        tenant = await this.userRepository.createTenant({
          tenantCode: dto.tenantCode,
          tenantName: dto.tenantName,
        });
      } else {
        if (tenant.tenant_name !== dto.tenantName)
          throw new AppError("租户名称与编码不匹配", 400001, 400);
        if (tenant.status !== "1")
          throw new AppError("该租户已被禁用", 403001, 403);
        if (tenant.expire_time && new Date(tenant.expire_time) < new Date())
          throw new AppError("该租户已过期", 403001, 403);
      }

      const data = await this.userRepository.registerUserInTenant({
        ...dto,
        tenantId: tenant.tenant_id,
        tenantName: tenant.tenant_name,
        username: dto.username,
        password: dto.password,
        email: dto.email,
        phone: dto.phone,
      });
      success(res, data, "注册成功");
    } catch (err) {
      this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: unknown) {
    if (err instanceof AppError)
      return error(res, err.message, err.code, err.statusCode);
    logger.error({ err }, "[AuthRegister] error");
    error(res, "操作失败", 500, 500);
  }
}
