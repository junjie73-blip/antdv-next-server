import {
  Controller,
  Delete,
  Get,
  Req,
  Res,
  ApiOperation,
} from "@/core/decorator/index.js";
import { Request, Response } from "express";
import { success, error } from "@/shared/http/response.js";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { redis } from "@/config/redis.js";
import { revokeSession } from "../service/token.service.js";

interface AuthUser {
  userId: string;
  tenantId: string;
}

@Controller("/auth", { tags: ["认证"] })
export default class AuthDeviceController {
  /** 当前用户所有在线设备 */
  @Get("/my-devices")
  @ApiOperation("获取当前用户的在线设备列表")
  async myDevices(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as AuthUser;
      if (!user?.userId || !user?.tenantId) {
        throw new AppError("未认证", 401001, 401);
      }
      const currentDeviceId = (req as any).deviceId as string | undefined;
      const pattern = `access:${user.tenantId}:${user.userId}:*`;

      const keys: string[] = [];
      let cursor = "0";
      do {
        const [next, batch] = await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = next;
        keys.push(...batch);
      } while (cursor !== "0");

      const devices = await Promise.all(
        keys.map(async (key) => {
          const deviceId = key.split(":")[3];
          const ttl = await redis.ttl(key);
          if (ttl <= 0) return null;
          // 尝试读取设备信息（可选）
          const info = await redis.get(
            `device:${user.tenantId}:${user.userId}:${deviceId}`,
          );
          const parsed = info ? safeParse(info) : {};
          return {
            deviceId,
            current: deviceId === currentDeviceId,
            lastActiveAt: parsed.lastActiveAt ?? null,
            ip: parsed.ip ?? null,
            userAgent: parsed.userAgent ?? null,
            ttl,
          };
        }),
      );

      success(
        res,
        devices.filter((d): d is NonNullable<typeof d> => d !== null),
      );
    } catch (err) {
      handleError(res, err);
    }
  }

  /** 踢掉指定设备 */
  @Delete("/my-devices/:deviceId")
  @ApiOperation("下线指定设备")
  async kickMyDevice(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user as AuthUser;
      if (!user?.userId || !user?.tenantId)
        throw new AppError("未认证", 401001, 401);

      const targetDevice = req.params.deviceId;
      const currentDevice = (req as any).deviceId;

      if (!targetDevice) throw new AppError("缺少 deviceId", 400001, 400);
      if (targetDevice === currentDevice) {
        throw new AppError("不能踢出当前设备，请使用退出登录", 400001, 400);
      }

      await revokeSession(user.tenantId, user.userId, targetDevice);
      logger.info(
        { userId: user.userId, tenantId: user.tenantId, targetDevice },
        "[auth] device kicked",
      );
      success(res, null, "该设备已下线");
    } catch (err) {
      handleError(res, err);
    }
  }
}

function safeParse(s: string): Record<string, any> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function handleError(res: Response, err: unknown) {
  if (err instanceof AppError)
    return error(res, err.message, err.code, err.statusCode);
  logger.error({ err }, "[AuthDevice] error");
  error(res, "操作失败", 500, 500);
}
