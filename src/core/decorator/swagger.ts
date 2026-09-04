import "reflect-metadata";
import { METADATA_KEYS, SwaggerMetadata } from "./metadata.js";

function getSwaggerMetadata(target: any, propertyKey: string | symbol) {
  return (
    Reflect.getMetadata(
      METADATA_KEYS.SWAGGER,
      target.constructor,
      propertyKey,
    ) || {}
  );
}

function setSwaggerMetadata(
  target: any,
  propertyKey: string | symbol,
  swagger: SwaggerMetadata,
) {
  Reflect.defineMetadata(
    METADATA_KEYS.SWAGGER,
    swagger,
    target.constructor,
    propertyKey,
  );
}

export function SwaggerDoc(doc: SwaggerMetadata): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existing = getSwaggerMetadata(target, propertyKey);
    Object.assign(existing, doc);
    setSwaggerMetadata(target, propertyKey, existing);
    return descriptor;
  };
}

export function ApiOperation(
  summary: string,
  description?: string,
): MethodDecorator {
  return SwaggerDoc({ summary, description });
}

export function ApiResponse(
  status: number,
  description: string,
  schema?: any,
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const swagger = getSwaggerMetadata(target, propertyKey);
    if (!swagger.responses) swagger.responses = {};
    swagger.responses[status] = {
      description,
      ...(schema ? { content: { "application/json": { schema } } } : {}),
    };
    setSwaggerMetadata(target, propertyKey, swagger);
    return descriptor;
  };
}

export function ApiBody(schema: any): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const swagger = getSwaggerMetadata(target, propertyKey);
    swagger.requestBody = { content: { "application/json": { schema } } };
    setSwaggerMetadata(target, propertyKey, swagger);
    return descriptor;
  };
}

export function ApiQuery(schema: any): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const swagger = getSwaggerMetadata(target, propertyKey);
    swagger.query = schema;
    setSwaggerMetadata(target, propertyKey, swagger);
    return descriptor;
  };
}

export function ApiTags(...tags: string[]): ClassDecorator {
  return (target: any) => {
    const existing: string[] =
      Reflect.getMetadata(METADATA_KEYS.CONTROLLER_TAGS, target) || [];
    Reflect.defineMetadata(
      METADATA_KEYS.CONTROLLER_TAGS,
      [...existing, ...tags],
      target,
    );
  };
}
