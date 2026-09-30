import type { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { status } from "@grpc/grpc-js";
import {
  type VerifyTokenRequest,
  type VerifyTokenResponse,
  type GetPermissionsRequest,
  type GetPermissionsResponse,
  type CheckPermissionRequest,
  type CheckPermissionResponse,
  type KickUserRequest,
  type Empty,
} from "@saas/contracts/grpc";
import { AuthService } from "../domain/auth.service.js";
import { permissionService } from "../domain/permission.service.js";
import { verifyAccessToken } from "../domain/token.service.js";
import { kickUser } from "../domain/kick.service.js";
import { redis } from "../config/redis.js";
import { logger } from "../config/logger.js";

const authService = new AuthService();

export const authHandler = {
  async VerifyToken(
    call: ServerUnaryCall<VerifyTokenRequest, VerifyTokenResponse>,
    callback: sendUnaryData<VerifyTokenResponse>,
  ): Promise<void> {
    const { token } = call.request;
    if (!token) {
      return callback(null, {
        valid: false,
        userId: "",
        tenantId: "",
        username: "",
        deviceId: "",
        roles: [],
        reason: "token required",
      });
    }

    try {
      const payload = await verifyAccessToken(token);

      const sessionKey = `access:${payload.tenantId}:${payload.userId}:${payload.deviceId}`;
      const session = await redis.get(sessionKey);
      if (!session) {
        return callback(null, {
          valid: false,
          userId: "",
          tenantId: "",
          username: "",
          deviceId: "",
          roles: [],
          reason: "session expired",
        });
      }

      const kicked = await redis.ttl(`kicked:${payload.userId}`);
      if (kicked > 0) {
        return callback(null, {
          valid: false,
          userId: "",
          tenantId: "",
          username: "",
          deviceId: "",
          roles: [],
          reason: "kicked",
        });
      }

      callback(null, {
        valid: true,
        userId: payload.userId,
        tenantId: payload.tenantId,
        username: payload.username,
        deviceId: payload.deviceId,
        roles: payload.roles ?? [],
        reason: "",
      });
    } catch (err: any) {
      logger.warn({ err: err.message }, "[grpc] VerifyToken failed");
      callback(null, {
        valid: false,
        userId: "",
        tenantId: "",
        username: "",
        deviceId: "",
        roles: [],
        reason: err?.message ?? "invalid token",
      });
    }
  },

  async GetUserPermissions(
    call: ServerUnaryCall<GetPermissionsRequest, GetPermissionsResponse>,
    callback: sendUnaryData<GetPermissionsResponse>,
  ): Promise<void> {
    const { userId, tenantId } = call.request;
    if (!userId || !tenantId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "userId and tenantId required",
      } as any);
    }

    try {
      const perms = await permissionService.getUserPermissions(
        userId,
        tenantId,
      );
      callback(null, { permissions: perms });
    } catch (err: any) {
      logger.error({ err }, "[grpc] GetUserPermissions failed");
      callback({
        code: status.INTERNAL,
        message: err?.message ?? "internal",
      } as any);
    }
  },

  async CheckPermission(
    call: ServerUnaryCall<CheckPermissionRequest, CheckPermissionResponse>,
    callback: sendUnaryData<CheckPermissionResponse>,
  ): Promise<void> {
    const { userId, tenantId, permission } = call.request;
    if (!userId || !tenantId || !permission) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "missing arguments",
      } as any);
    }

    try {
      const allowed = await permissionService.checkPermission(
        userId,
        tenantId,
        permission,
      );
      callback(null, { allowed, reason: "" });
    } catch (err: any) {
      callback({ code: status.INTERNAL, message: err?.message } as any);
    }
  },

  async KickUser(
    call: ServerUnaryCall<KickUserRequest, Empty>,
    callback: sendUnaryData<Empty>,
  ): Promise<void> {
    const { userId, tenantId, reason, operatorId } = call.request;
    if (!userId || !tenantId) {
      return callback({
        code: status.INVALID_ARGUMENT,
        message: "missing arguments",
      } as any);
    }

    try {
      await kickUser({ userId, tenantId, reason, operatorId });
      callback(null, {});
    } catch (err: any) {
      logger.error({ err }, "[grpc] KickUser failed");
      callback({ code: status.INTERNAL, message: err?.message } as any);
    }
  },
};

void authService;
