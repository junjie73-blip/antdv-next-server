import "reflect-metadata";
import { RequestHandler } from "express";
import { z } from "zod";

export const CONTROLLER_KEY = Symbol("controller");
export const ROUTES_KEY = Symbol("routes");

const TAGS_KEY = Symbol("tags");
const SUMMARY_KEY = Symbol("summary");
const DESC_KEY = Symbol("description");
const QUERY_KEY = Symbol("query");
const BODY_KEY = Symbol("body");
const PARAMS_KEY = Symbol("params");
const RESPONSES_KEY = Symbol("responses");
const MIDDLEWARES_KEY = Symbol("middlewares");

export interface RouteInfo {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  propertyKey: string;
}

export interface ResponseDef {
  status: number;
  schema?: z.ZodTypeAny;
  description?: string;
}

/** 类装饰器：标记 Controller 基础路径 */
export function Controller(basePath: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(CONTROLLER_KEY, { basePath }, target);
  };
}

/** HTTP 方法装饰器 - 只接收路径 */
function createMethod(method: RouteInfo["method"]) {
  return (path: string): MethodDecorator => {
    return (target, propertyKey) => {
      const routes: RouteInfo[] = Reflect.getMetadata(ROUTES_KEY, target) || [];
      routes.push({ method, path, propertyKey: propertyKey as string });
      Reflect.defineMetadata(ROUTES_KEY, routes, target);
    };
  };
}

export const Get = createMethod("get");
export const Post = createMethod("post");
export const Put = createMethod("put");
export const Delete = createMethod("delete");
export const Patch = createMethod("patch");

/** 文档装饰器 - 支持多次叠加 */
function pushMeta(key: symbol, value: any): MethodDecorator {
  return (target, propertyKey) => {
    const existing: any[] =
      Reflect.getMetadata(key, target, propertyKey!) || [];
    existing.push(value);
    Reflect.defineMetadata(key, existing, target, propertyKey!);
  };
}

export function Tag(...tags: string[]): MethodDecorator {
  return pushMeta(TAGS_KEY, tags);
}

export function Summary(text: string): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(SUMMARY_KEY, text, target, propertyKey!);
  };
}

export function Description(text: string): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(DESC_KEY, text, target, propertyKey!);
  };
}

/** 校验装饰器 - 支持多次叠加，扫描时自动合并为 intersection */
export function Query(schema: z.ZodTypeAny): MethodDecorator {
  return pushMeta(QUERY_KEY, schema);
}

export function Body(schema: z.ZodTypeAny): MethodDecorator {
  return pushMeta(BODY_KEY, schema);
}

export function Params(schema: z.ZodTypeAny): MethodDecorator {
  return pushMeta(PARAMS_KEY, schema);
}

/** 中间件装饰器 - 支持多次叠加 */
export function Middleware(...handlers: RequestHandler[]): MethodDecorator {
  return (target, propertyKey) => {
    const existing: RequestHandler[] =
      Reflect.getMetadata(MIDDLEWARES_KEY, target, propertyKey!) || [];
    Reflect.defineMetadata(
      MIDDLEWARES_KEY,
      [...existing, ...handlers],
      target,
      propertyKey!,
    );
  };
}

/** 响应装饰器 - 支持多次使用 */
export function Response(
  status: number,
  schema?: z.ZodTypeAny,
  description?: string,
): MethodDecorator {
  return pushMeta(RESPONSES_KEY, { status, schema, description });
}

const PERMISSIONS_KEY = Symbol("permissions");
const ROLES_KEY = Symbol("roles");

export function RequirePermission(...permissions: string[]): MethodDecorator {
  return (target, propertyKey) => {
    const existing: string[] =
      Reflect.getMetadata(PERMISSIONS_KEY, target, propertyKey!) || [];
    Reflect.defineMetadata(
      PERMISSIONS_KEY,
      [...existing, ...permissions],
      target,
      propertyKey!,
    );
  };
}

export function RequireRole(...roles: string[]): MethodDecorator {
  return (target, propertyKey) => {
    const existing: string[] =
      Reflect.getMetadata(ROLES_KEY, target, propertyKey!) || [];
    Reflect.defineMetadata(
      ROLES_KEY,
      [...existing, ...roles],
      target,
      propertyKey!,
    );
  };
}

export {
  TAGS_KEY,
  SUMMARY_KEY,
  DESC_KEY,
  QUERY_KEY,
  BODY_KEY,
  PARAMS_KEY,
  RESPONSES_KEY,
  MIDDLEWARES_KEY,
  PERMISSIONS_KEY,
  ROLES_KEY,
};
