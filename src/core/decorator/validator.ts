import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { METADATA_KEYS } from "./metadata.js";
import { ValidationSchema } from "./types.js";

export function Validate(schema: ValidationSchema): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor;
    const routes = Reflect.getMetadata(METADATA_KEYS.ROUTES, constructor) || [];
    const route = routes.find((r: any) => r.propertyKey === propertyKey);
    if (route) {
      route.validate = schema;
    }
    Reflect.defineMetadata(METADATA_KEYS.ROUTES, routes, constructor);
    return descriptor;
  };
}

export function Body(schema: z.ZodTypeAny): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "body", schema });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function Query(key?: string): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "query", key });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function Param(key?: string): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "param", key });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function Req(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "req" });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function Res(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "res" });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function CurrentUser(): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    if (!propertyKey) return;
    const existing =
      Reflect.getMetadata(
        METADATA_KEYS.PARAMS,
        target.constructor,
        propertyKey,
      ) || [];
    existing.push({ index: parameterIndex, type: "user" });
    Reflect.defineMetadata(
      METADATA_KEYS.PARAMS,
      existing,
      target.constructor,
      propertyKey,
    );
  };
}

export function validateRequest(
  schema: ValidationSchema,
  req: Request,
): Record<string, any> {
  const result: Record<string, any> = {};
  if (schema.body) {
    const parsed = schema.body.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Body validation failed: ${messages}`);
    }
    result.body = parsed.data;
  }
  if (schema.query) {
    const parsed = schema.query.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Query validation failed: ${messages}`);
    }
    result.query = parsed.data;
  }
  if (schema.params) {
    const parsed = schema.params.safeParse(req.params);
    if (!parsed.success) {
      const messages = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Params validation failed: ${messages}`);
    }
    result.params = parsed.data;
  }
  return result;
}
