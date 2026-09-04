import { Request, Response, NextFunction } from "express";
import { METADATA_KEYS, RouteMetadata } from "./metadata.js";
import { ExpressMiddleware } from "./types.js";

export function UseMiddleware(...middlewares: ExpressMiddleware[]) {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): any {
    if (propertyKey !== undefined && descriptor !== undefined) {
      // Method decorator
      const constructor = target.constructor;
      const routes: RouteMetadata[] =
        Reflect.getMetadata(METADATA_KEYS.ROUTES, constructor) || [];
      const route = routes.find((r) => r.propertyKey === propertyKey);
      if (route) {
        route.middlewares = [...route.middlewares, ...middlewares];
      } else {
        routes.push({
          method: "get",
          path: "",
          propertyKey,
          middlewares: [...middlewares],
        });
      }
      Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, constructor);
      return descriptor;
    }
    // Class decorator
    const existing =
      Reflect.getMetadata(METADATA_KEYS.MIDDLEWARES, target) || [];
    Reflect.defineMetadata(
      METADATA_KEYS.MIDDLEWARES,
      [...existing, ...middlewares],
      target,
    );
    return target;
  };
}
