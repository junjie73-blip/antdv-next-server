import "reflect-metadata";
import {
  METADATA_KEYS,
  HttpMethod,
  RouteMetadata,
  SwaggerMetadata,
} from "./metadata.js";

function createRouteDecorator(method: HttpMethod, path: string = "") {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor;
    const routes: RouteMetadata[] =
      Reflect.getMetadata(METADATA_KEYS.ROUTES, constructor) || [];
    let route = routes.find((r) => r.propertyKey === propertyKey);
    if (!route) {
      route = { method, path, propertyKey, middlewares: [] };
      routes.push(route);
    } else {
      route.method = method;
      route.path = path;
    }

    // 读取 Swagger 元数据并附加到路由
    const swagger: SwaggerMetadata = Reflect.getMetadata(
      METADATA_KEYS.SWAGGER,
      constructor,
      propertyKey,
    );
    if (swagger) {
      route.swagger = swagger;
    }

    Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, constructor);
    return descriptor;
  };
}

export const Get = (path?: string) => createRouteDecorator("get", path || "");
export const Post = (path?: string) => createRouteDecorator("post", path || "");
export const Put = (path?: string) => createRouteDecorator("put", path || "");
export const Delete = (path?: string) =>
  createRouteDecorator("delete", path || "");
export const Patch = (path?: string) =>
  createRouteDecorator("patch", path || "");
export const Head = (path?: string) => createRouteDecorator("head", path || "");
export const Options = (path?: string) =>
  createRouteDecorator("options", path || "");
export const All = (path?: string) => createRouteDecorator("all", path || "");
