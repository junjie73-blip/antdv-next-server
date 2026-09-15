import "reflect-metadata";
import { METADATA_KEYS } from "./metadata.js";

export const MFA_METADATA_KEY = "controller:require-mfa";

export function RequireMFA(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      MFA_METADATA_KEY,
      true,
      target.constructor,
      propertyKey,
    );
    return descriptor;
  };
}
