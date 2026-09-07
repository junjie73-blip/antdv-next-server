import "reflect-metadata";
import { METADATA_KEYS, PermissionMetadata } from "./metadata.js";

export function RequirePermission(permission: string): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const constructor = target.constructor;
    const existing: PermissionMetadata[] =
      Reflect.getMetadata(METADATA_KEYS.PERMISSION, constructor, propertyKey) ||
      [];
    existing.push({ permission });
    Reflect.defineMetadata(
      METADATA_KEYS.PERMISSION,
      existing,
      constructor,
      propertyKey,
    );
    return descriptor;
  };
}
