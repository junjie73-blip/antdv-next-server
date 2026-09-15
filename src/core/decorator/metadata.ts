import "reflect-metadata";

export const METADATA_KEYS = {
  CONTROLLER_PREFIX: "controller:prefix",
  CONTROLLER_TAGS: "controller:tags",
  ROUTES: "controller:routes",
  MIDDLEWARES: "controller:middlewares",
  PARAMS: "controller:params",
  SWAGGER: "controller:swagger",
  VALIDATE: "controller:validate",
  PERMISSION: "controller:permission",
  INJECTABLE: "injectable:token",
  DESIGN_PARAM_TYPES: "design:paramtypes",
  REQUIRE_MFA: "controller:require-mfa",
} as const;

export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "all";

export interface RouteMetadata {
  method: HttpMethod;
  path: string;
  propertyKey: string | symbol;
  middlewares: Array<(req: any, res: any, next: any) => any>;
  swagger?: SwaggerMetadata;
  validate?: ValidateMetadata;
  permission?: PermissionMetadata;
}

export interface ControllerMetadata {
  prefix: string;
  tags?: string[];
  middlewares: Array<(req: any, res: any, next: any) => any>;
}

export interface SwaggerMetadata {
  summary?: string;
  description?: string;
  requestBody?: any;
  responses?: Record<number | string, any>;
  query?: any;
  params?: any;
  tags?: string[];
  deprecated?: boolean;
}

export interface ValidateMetadata {
  body?: any;
  query?: any;
  params?: any;
}

export interface PermissionMetadata {
  permission: string; // 权限标识，如 "user:list"
}

export interface ParamMetadata {
  index: number;
  type: "body" | "query" | "param" | "req" | "res" | "next" | "header" | "user";
  key?: string;
}
