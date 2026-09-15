import { z } from "zod";
import {
  Controller,
  Get,
  Post,
  UseMiddleware,
  Validate,
  Body,
  CurrentUser,
  SwaggerDoc,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from "@core/decorator/index.js";
import { authMiddleware } from "@middleware/auth.js";
import * as mfaService from "./service.js";
import { logger } from "@core/logger/index.js";

const TokenSchema = z
  .object({
    token: z.string().length(6).regex(/^\d+$/),
  })
  .openapi("MFAVerifyToken");

const UserIdParamSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .openapi("MFAUserIdParam");

@Controller("/mfa", { tags: ["MFA"] })
@UseMiddleware(authMiddleware)
export default class MFAController {
  @Post("/setup")
  @ApiOperation("初始化MFA设置", "生成TOTP密钥和二维码")
  @ApiResponse(
    200,
    "成功",
    z.object({ qrCode: z.string(), manualEntryKey: z.string() }),
  )
  @ApiResponse(401, "未认证")
  async setupMFA(@CurrentUser() user: any) {
    return await mfaService.generateSecret(user.userId);
  }

  @Post("/enable")
  @ApiOperation("启用MFA", "验证首次TOTP并启用MFA")
  @ApiBody(TokenSchema)
  @ApiResponse(200, "成功", z.object({ backupCodes: z.array(z.string()) }))
  @ApiResponse(400, "验证码错误")
  async enableMFA(
    @CurrentUser() user: any,
    @Body(TokenSchema) body: { token: string },
  ) {
    return await mfaService.verifyAndEnable(user.userId, body.token);
  }

  @Post("/verify")
  @ApiOperation("验证MFA令牌", "验证TOTP或备份码")
  @ApiBody(z.object({ userId: z.string().uuid(), token: z.string().length(6) }))
  @ApiResponse(
    200,
    "成功",
    z.object({
      valid: z.boolean(),
      remainingBackupCodes: z.number().optional(),
    }),
  )
  async verifyMFA(
    @Body(
      z.object({
        userId: z.string().uuid(),
        token: z.string().length(6).regex(/^\d+$/),
      }),
    )
    body: {
      userId: string;
      token: string;
    },
  ) {
    return await mfaService.verifyToken(body.userId, body.token);
  }

  @Post("/disable")
  @ApiOperation("禁用MFA", "需要当前有效的TOTP验证")
  @ApiBody(TokenSchema)
  @ApiResponse(200, "MFA已禁用")
  @ApiResponse(400, "验证码错误")
  async disableMFA(
    @CurrentUser() user: any,
    @Body(TokenSchema) body: { token: string },
  ) {
    await mfaService.disableMFA(user.userId, body.token);
    return { message: "MFA disabled successfully" };
  }

  @Get("/status")
  @ApiOperation("获取MFA状态")
  @ApiResponse(
    200,
    "成功",
    z.object({ enabled: z.boolean(), hasBackupCodes: z.boolean() }),
  )
  async getMFAStatus(@CurrentUser() user: any) {
    return await mfaService.getMFAStatus(user.userId);
  }

  @Post("/backup-codes/regenerate")
  @ApiOperation("重新生成备份码", "需要当前有效的TOTP验证")
  @ApiBody(TokenSchema)
  @ApiResponse(200, "成功", z.object({ backupCodes: z.array(z.string()) }))
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body(TokenSchema) body: { token: string },
  ) {
    return await mfaService.regenerateBackupCodes(user.userId, body.token);
  }
}
