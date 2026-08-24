import { Router, Request, Response, NextFunction } from "express";
import {
  OpenAPIRegistry,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export interface RouteDef {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  handler: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<any> | any;
  docs?: Partial<RouteConfig>;
  validate?: {
    body?: z.ZodTypeAny;
    query?: z.ZodTypeAny;
    params?: z.ZodTypeAny;
  };
}

export abstract class BaseController {
  public readonly router = Router();
  public abstract basePath: string;

  protected _registry?: OpenAPIRegistry;

  protected addRoute(route: RouteDef) {
    const middlewares: Array<
      (req: Request, res: Response, next: NextFunction) => any
    > = [];

    if (route.validate?.body)
      middlewares.push(this.makeValidator(route.validate.body, "body"));
    if (route.validate?.query)
      middlewares.push(this.makeValidator(route.validate.query, "query"));
    if (route.validate?.params)
      middlewares.push(this.makeValidator(route.validate.params, "params"));

    this.router[route.method](
      route.path,
      ...middlewares,
      async (req, res, next) => {
        try {
          await route.handler(req, res, next);
        } catch (err) {
          next(err);
        }
      },
    );

    if (this._registry && route.docs) {
      this._registry.registerPath({
        method: route.method,
        path: `${this.basePath}${route.path}`,
        ...route.docs,
      } as RouteConfig);
    }
  }

  private makeValidator(
    schema: z.ZodTypeAny,
    source: "body" | "query" | "params",
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        res.status(400).json({
          success: false,
          message: "参数校验失败",
          errors: result.error.issues
            .map((issue) => ({
              message: issue.message,
              path: issue.path.join("."),
            }))
            .join("\n"),
        });
        return;
      }
      next();
    };
  }

  /** 子类覆盖：用 addRoute 注册路由，或用装饰器 */
  abstract init(): void;

  register(app: any, registry: OpenAPIRegistry) {
    this._registry = registry;
    this.init();
    app.use(this.basePath, this.router);
  }
}
