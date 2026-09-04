import "reflect-metadata";
import { METADATA_KEYS, ControllerMetadata } from "./metadata.js";
import { ExpressMiddleware } from "./types.js";

export function Controller(
  prefix: string,
  options?: { tags?: string[]; middlewares?: ExpressMiddleware[] },
): ClassDecorator {
  return (target: any) => {
    const existingRoutes =
      Reflect.getMetadata(METADATA_KEYS.ROUTES, target) || [];
    const metadata: ControllerMetadata = {
      prefix: prefix.startsWith("/") ? prefix : `/${prefix}`,
      tags: options?.tags || [target.name.replace("Controller", "")],
      middlewares: options?.middlewares || [],
    };
    Reflect.defineMetadata(
      METADATA_KEYS.CONTROLLER_PREFIX,
      metadata.prefix,
      target,
    );
    Reflect.defineMetadata(
      METADATA_KEYS.CONTROLLER_TAGS,
      metadata.tags,
      target,
    );
    Reflect.defineMetadata(METADATA_KEYS.ROUTES, existingRoutes, target);
    if (options?.middlewares) {
      Reflect.defineMetadata(
        METADATA_KEYS.MIDDLEWARES,
        options.middlewares,
        target,
      );
    }
  };
}
