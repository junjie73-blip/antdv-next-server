import { Router, Request, Response, NextFunction } from "express";
import {
  METADATA_KEYS,
  RouteMetadata,
  ParamMetadata,
  PermissionMetadata,
} from "./metadata.js";
import { ControllerScanner, ScannedController } from "./scanner.js";
import { registry } from "@core/swagger/registry.js";
import { validateRequest } from "./validator.js";
import { logger } from "@core/logger/index.js";
import { checkUserPermissions } from "@/common/utils/permission.js";
import { requireMfaMiddleware } from "@/middleware/require-mfa.js";
import { MFA_METADATA_KEY } from "./require-mfa.js";
export class DecoratorRouter {
  private router = Router();
  private scanner: ControllerScanner;

  constructor(scanner: ControllerScanner) {
    this.scanner = scanner;
  }

  build(): Router {
    const controllers = this.scanner.scan();
    for (const ctrl of controllers) {
      this.registerController(ctrl);
    }
    return this.router;
  }

  private registerController(ctrl: ScannedController): void {
    const { prefix, instance, routes, classMiddlewares, tags } = ctrl;
    for (const route of routes) {
      const { method, path, propertyKey, middlewares, swagger, validate } =
        route;
      const fullPath = this.joinPaths(prefix, path);
      const handler = this.buildHandler(instance, propertyKey, validate);
      const allMiddlewares = [...classMiddlewares, ...middlewares];
      (this.router as any)[method](fullPath, ...allMiddlewares, handler);
      this.registerSwagger(fullPath, method, route, tags);
      logger.debug(
        {
          method: method.toUpperCase(),
          path: fullPath,
          handler: String(propertyKey),
        },
        "Route registered",
      );
    }
  }

  private buildHandler(
    instance: any,
    propertyKey: string | symbol,
    validate?: any,
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (validate) {
          validateRequest(validate, req);
        }
        let paramMetadata = Reflect.getMetadata(
          METADATA_KEYS.PARAMS,
          Object.getPrototypeOf(instance),
          propertyKey,
        );
        if (!paramMetadata) {
          paramMetadata =
            Reflect.getMetadata(
              METADATA_KEYS.PARAMS,
              instance.constructor,
              propertyKey,
            ) || [];
        }
        const permissionMetadata: PermissionMetadata[] =
          Reflect.getMetadata(
            METADATA_KEYS.PERMISSION,
            instance.constructor,
            propertyKey,
          ) || [];
        if (permissionMetadata.length > 0) {
          const requiredPerms = permissionMetadata.map((p) => p.permission); // 注意是 p.permission
          const hasPermission = await checkUserPermissions(
            req.user,
            requiredPerms,
          );
          if (!hasPermission) {
            return res.status(403).json({
              code: 403,
              message: "无权限访问",
              data: null,
              timestamp: Date.now(),
            });
          }
        }
        const requireMfa =
          Reflect.getMetadata(
            MFA_METADATA_KEY,
            instance.constructor,
            propertyKey,
          ) === true;
        if (requireMfa) {
          // 走 MFA 校验
          await new Promise<void>((resolve, reject) => {
            requireMfaMiddleware(req, res, (err?: any) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
        const args = paramMetadata
          .sort((a: any, b: any) => a.index - b.index)
          .map((param: any) => {
            switch (param.type) {
              case "body":
                return param.key ? req.body[param.key] : req.body;
              case "query":
                return param.key ? req.query[param.key] : req.query;
              case "param":
                return param.key ? req.params[param.key] : req.params;
              case "req":
                return req;
              case "res":
                return res;
              case "user":
                return (req as any).user;
              default:
                return undefined;
            }
          });
        const result = await instance[propertyKey](...args);
        if (result !== undefined && !res.headersSent) {
          res.json({
            code: 200,
            message: "success",
            data: result,
            timestamp: new Date().getTime(),
          });
        }
      } catch (err) {
        next(err);
      }
    };
  }

  private joinPaths(prefix: string, path: string): string {
    const np = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    const npath = path.startsWith("/") ? path : `/${path}`;
    if (!np) return npath || "/";
    return npath === "/" ? np : `${np}${npath}`;
  }

  private registerSwagger(
    path: string,
    method: string,
    route: RouteMetadata,
    controllerTags: string[],
  ): void {
    if (!route.swagger) return;
    const swaggerPath = path.replace(/:([^/]+)/g, "{$1}");
    const tags = route.swagger.tags || controllerTags;

    // 构建 request 对象，仅在存在 body 或 query 时才传递
    const request =
      route.swagger.requestBody || route.swagger.query
        ? {
            body: route.swagger.requestBody,
            query: route.swagger.query,
          }
        : undefined;

    registry.registerPath({
      method: method as any,
      path: swaggerPath,
      tags,
      summary: route.swagger.summary,
      description: route.swagger.description,
      request,
      responses: route.swagger.responses || {
        200: { description: "Success" },
        400: { description: "Bad Request" },
        401: { description: "Unauthorized" },
        500: { description: "Internal Server Error" },
      },
    });
  }
}
