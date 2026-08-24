import { Express, Router, Request, Response, NextFunction } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import {
  CONTROLLER_KEY,
  ROUTES_KEY,
  TAGS_KEY,
  SUMMARY_KEY,
  DESC_KEY,
  QUERY_KEY,
  BODY_KEY,
  PARAMS_KEY,
  RESPONSES_KEY,
  MIDDLEWARES_KEY,
  type RouteInfo,
  type ResponseDef,
} from "./decorators.js";
import { BaseController } from "./base-controller.js";

function createValidator(
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

/** 将多个 z.object 扁平合并为一个 z.object */
function mergeObjectSchemas(
  schemas: z.ZodTypeAny[],
): z.ZodObject<any> | undefined {
  if (schemas.length === 0) return undefined;
  if (schemas.length === 1 && schemas[0] instanceof z.ZodObject) {
    return schemas[0] as z.ZodObject<any>;
  }

  const shapes: Record<string, z.ZodTypeAny> = {};
  for (const schema of schemas) {
    // 直接是 ZodObject
    if (schema instanceof z.ZodObject) {
      Object.assign(shapes, schema.shape);
      continue;
    }
    // 某些包装后的对象（如 .optional(), .default() 等）
    const unwrapped = unwrapZodType(schema);
    if (unwrapped instanceof z.ZodObject) {
      Object.assign(shapes, unwrapped.shape);
    }
  }

  if (Object.keys(shapes).length === 0) return undefined;
  return z.object(shapes);
}

/** 解包被 .optional(), .default(), .nullable() 等包装的对象 */
function unwrapZodType(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: any = schema;
  while (current) {
    if (current instanceof z.ZodObject) return current;
    // 处理常见包装器
    if (current._def?.innerType) {
      current = current._def.innerType;
    } else if (current._def?.schema) {
      current = current._def.schema;
    } else {
      break;
    }
  }
  return schema;
}

/** 读取方法上的所有元数据 */
function collectMeta(target: any, propertyKey: string) {
  // Tag: 二维数组拍平
  const tagArrays: string[][] =
    Reflect.getMetadata(TAGS_KEY, target, propertyKey) || [];
  const tags = tagArrays.flat();

  // Query/Body/Params: 多个 schema 扁平合并为一个 z.object
  const querySchemas: z.ZodTypeAny[] =
    Reflect.getMetadata(QUERY_KEY, target, propertyKey) || [];
  const bodySchemas: z.ZodTypeAny[] =
    Reflect.getMetadata(BODY_KEY, target, propertyKey) || [];
  const paramsSchemas: z.ZodTypeAny[] =
    Reflect.getMetadata(PARAMS_KEY, target, propertyKey) || [];

  return {
    tags,
    summary: Reflect.getMetadata(SUMMARY_KEY, target, propertyKey) as
      | string
      | undefined,
    description: Reflect.getMetadata(DESC_KEY, target, propertyKey) as
      | string
      | undefined,
    query: mergeObjectSchemas(querySchemas),
    body: mergeObjectSchemas(bodySchemas),
    params: mergeObjectSchemas(paramsSchemas),
    responses:
      (Reflect.getMetadata(
        RESPONSES_KEY,
        target,
        propertyKey,
      ) as ResponseDef[]) || [],
    middlewares:
      (Reflect.getMetadata(MIDDLEWARES_KEY, target, propertyKey) as Array<
        (req: Request, res: Response, next: NextFunction) => any
      >) || [],
  };
}

export function registerController(
  app: Express,
  ControllerClass: any,
  registry: OpenAPIRegistry,
) {
  const meta = Reflect.getMetadata(CONTROLLER_KEY, ControllerClass);

  if (!meta) {
    console.error(
      `[Scanner] ❌ ${ControllerClass.name} 缺少 @Controller 装饰器，跳过注册`,
    );
    return;
  }

  const instance = new ControllerClass();

  // 如果继承自 BaseController，调用其 register 方法（内部用 addRoute 注册）
  if (instance instanceof BaseController) {
    instance.register(app, registry);
    console.log(
      `[Scanner] ✅ 已注册: ${ControllerClass.name} → ${meta.basePath} (BaseController 模式)`,
    );
    return;
  }

  const { basePath } = meta;
  const router = Router();

  // 收集原型链上的路由
  const routes: RouteInfo[] = [];
  let proto = ControllerClass.prototype;
  while (proto && proto !== Object.prototype) {
    const meta = Reflect.getMetadata(ROUTES_KEY, proto) as
      | RouteInfo[]
      | undefined;
    if (meta) routes.push(...meta);
    proto = Object.getPrototypeOf(proto);
  }

  for (const route of routes) {
    const m = collectMeta(ControllerClass.prototype, route.propertyKey);
    const middlewares = [...m.middlewares];

    // 自动挂载 Zod 校验（用原始 schemas 数组分别校验，更精确）
    const rawQuerySchemas: z.ZodTypeAny[] =
      Reflect.getMetadata(
        QUERY_KEY,
        ControllerClass.prototype,
        route.propertyKey,
      ) || [];
    const rawBodySchemas: z.ZodTypeAny[] =
      Reflect.getMetadata(
        BODY_KEY,
        ControllerClass.prototype,
        route.propertyKey,
      ) || [];
    const rawParamsSchemas: z.ZodTypeAny[] =
      Reflect.getMetadata(
        PARAMS_KEY,
        ControllerClass.prototype,
        route.propertyKey,
      ) || [];

    // 校验中间件：合并后的 schema
    const mergedQuery = mergeObjectSchemas(rawQuerySchemas);
    const mergedBody = mergeObjectSchemas(rawBodySchemas);
    const mergedParams = mergeObjectSchemas(rawParamsSchemas);

    if (mergedQuery) middlewares.push(createValidator(mergedQuery, "query"));
    if (mergedBody) middlewares.push(createValidator(mergedBody, "body"));
    if (mergedParams) middlewares.push(createValidator(mergedParams, "params"));

    // Express 路由
    const handler = async (req: Request, res: Response, next: NextFunction) => {
      try {
        await instance[route.propertyKey](req, res, next);
      } catch (err) {
        next(err);
      }
    };

    router[route.method](route.path, ...middlewares, handler);

    // 构建 OpenAPI request
    const request: any = {};
    if (m.query) request.query = m.query;
    if (m.body)
      request.body = {
        content: { "application/json": { schema: m.body } },
        description: "请求体",
      };
    if (m.params) request.params = m.params;

    // 构建 OpenAPI responses
    const responses: any = {};
    for (const r of m.responses) {
      responses[r.status] = {
        description: r.description || "",
        ...(r.schema
          ? { content: { "application/json": { schema: r.schema } } }
          : {}),
      };
    }

    // 注册 OpenAPI 路径
    registry.registerPath({
      method: route.method,
      path: `${basePath}${route.path}`,
      tags: m.tags.length > 0 ? m.tags : undefined,
      summary: m.summary,
      description: m.description,
      ...(Object.keys(request).length > 0 ? { request } : {}),
      responses,
    } as any);
  }

  app.use(basePath, router);
  console.log(`[Scanner] ✅ 已注册: ${ControllerClass.name} → ${basePath}`);
}
