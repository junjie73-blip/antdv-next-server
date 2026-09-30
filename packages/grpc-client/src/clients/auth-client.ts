import type { Resolver } from "../resolver/types.js";
import { createClient } from "../client-factory.js";
import { normalizeGrpcError } from "../errors.js";
import type {
  VerifyTokenRequest,
  VerifyTokenResponse,
  GetPermissionsRequest,
  GetPermissionsResponse,
  CheckPermissionRequest,
  CheckPermissionResponse,
  KickUserRequest,
  Empty,
} from "@saas/contracts/grpc";

interface RawAuthClient {
  verifyToken(
    req: VerifyTokenRequest,
    options: Record<string, unknown>,
    cb: (err: any, res: VerifyTokenResponse) => void,
  ): void;
  getUserPermissions(
    req: GetPermissionsRequest,
    options: Record<string, unknown>,
    cb: (err: any, res: GetPermissionsResponse) => void,
  ): void;
  checkPermission(
    req: CheckPermissionRequest,
    options: Record<string, unknown>,
    cb: (err: any, res: CheckPermissionResponse) => void,
  ): void;
  kickUser(
    req: KickUserRequest,
    options: Record<string, unknown>,
    cb: (err: any, res: Empty) => void,
  ): void;
  close(): void;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export class AuthClient {
  private raw: RawAuthClient | null = null;
  private connecting: Promise<RawAuthClient> | null = null;

  constructor(
    private readonly resolver: Resolver,
    private readonly serviceName = "auth-svc",
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  private async ensureClient(): Promise<RawAuthClient> {
    if (this.raw) return this.raw;
    if (this.connecting) return this.connecting;

    this.connecting = createClient<RawAuthClient>({
      serviceName: this.serviceName,
      protoFile: "auth.proto",
      protoPackage: "saas.auth",
      serviceClass: "AuthService",
      resolver: this.resolver,
      enableRetry: true,
    }).then((c) => {
      this.raw = c;
      this.connecting = null;
      return c;
    });

    return this.connecting;
  }

  /** 通用调用包装：注入 deadline、错误归一化 */
  private call<TReq, TRes>(
    methodName: keyof RawAuthClient,
    req: TReq,
    timeoutMs = this.timeoutMs,
  ): Promise<TRes> {
    return this.ensureClient().then(
      (client) =>
        new Promise<TRes>((resolve, reject) => {
          const method = client[methodName] as any;
          method.call(
            client,
            req,
            { deadline: Date.now() + timeoutMs },
            (err: any, res: TRes) => {
              if (err) reject(normalizeGrpcError(err));
              else resolve(res);
            },
          );
        }),
    );
  }

  verifyToken(req: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    return this.call("verifyToken", req);
  }

  getUserPermissions(
    req: GetPermissionsRequest,
  ): Promise<GetPermissionsResponse> {
    return this.call("getUserPermissions", req);
  }

  checkPermission(
    req: CheckPermissionRequest,
  ): Promise<CheckPermissionResponse> {
    return this.call("checkPermission", req);
  }

  kickUser(req: KickUserRequest): Promise<Empty> {
    return this.call("kickUser", req);
  }

  close(): void {
    if (this.raw) {
      this.raw.close();
      this.raw = null;
    }
    this.connecting = null;
  }
}
