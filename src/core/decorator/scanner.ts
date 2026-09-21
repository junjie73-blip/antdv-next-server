import "reflect-metadata";
import { METADATA_KEYS, RouteMetadata } from "./metadata.js";
import { logger } from "@/platform/logger/index.js";

export interface ControllerClass {
  new (...args: any[]): any;
}

export interface ScannedController {
  target: ControllerClass;
  instance: any;
  prefix: string;
  tags: string[];
  routes: RouteMetadata[];
  classMiddlewares: Array<(req: any, res: any, next: any) => any>;
}

export class ControllerScanner {
  private controllers: ControllerClass[] = [];

  register(...controllers: ControllerClass[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  scan(): ScannedController[] {
    return this.controllers.map((target) => {
      const prefix =
        Reflect.getMetadata(METADATA_KEYS.CONTROLLER_PREFIX, target) || "";
      const tags: string[] =
        Reflect.getMetadata(METADATA_KEYS.CONTROLLER_TAGS, target) || [];
      const routes: RouteMetadata[] =
        Reflect.getMetadata(METADATA_KEYS.ROUTES, target) || [];
      const classMiddlewares =
        Reflect.getMetadata(METADATA_KEYS.MIDDLEWARES, target) || [];
      const instance = new target();

      logger.debug(
        { controller: target.name, prefix, routeCount: routes.length },
        "Controller scanned",
      );

      return { target, instance, prefix, tags, routes, classMiddlewares };
    });
  }
}
