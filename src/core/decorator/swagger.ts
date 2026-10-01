import "reflect-metadata";
import { z } from "zod";
import { METADATA_KEYS, SwaggerMetadata } from "./metadata.js";

/* ============================================================
 * ⭐ ApiQuery 支持的参数描述
 * ============================================================ */
export interface ApiQueryParam {
  name: string;
  required?: boolean;
  description?: string;
  type?: "string" | "number" | "boolean" | "array";
  default?: unknown;
  enum?: readonly string[];
  example?: unknown;
}

/** 归一化后的内部存储 */
export interface NormalizedQueryInput {
  /** zod object schema（若是 zod 形式） */
  schema?: z.ZodTypeAny;
  /** 对象描述形式的参数列表 */
  params: ApiQueryParam[];
}

/* ============================================================
 * 内部：操作 swagger metadata
 * ============================================================ */
function getSwaggerMetadata(
  target: any,
  propertyKey: string | symbol,
): SwaggerMetadata & {
  _queryInputs?: NormalizedQueryInput[];
} {
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
  swagger: SwaggerMetadata & { _queryInputs?: NormalizedQueryInput[] },
): void {
  Reflect.defineMetadata(
    METADATA_KEYS.SWAGGER,
    swagger,
    target.constructor,
    propertyKey,
  );
}

/* ============================================================
 * 判断输入类型
 * ============================================================ */
function isZodObject(input: any): boolean {
  if (!input || typeof input !== "object") return false;
  // zod v3：instanceof z.ZodObject
  if (z.ZodObject && input instanceof z.ZodObject) return true;
  // zod v4：通过 _def.typeName / _zod.def.type 判断
  const typeName =
    input._def?.typeName ?? input._def?.type ?? input._zod?.def?.type;
  return typeName === "ZodObject" || typeName === "object";
}

function isZodSchema(input: any): boolean {
  if (!input || typeof input !== "object") return false;
  // 有 _def 或 _zod 属性就视为 zod schema
  return !!(input._def || input._zod);
}

function isParamDescriptor(input: any): input is ApiQueryParam {
  return (
    input &&
    typeof input === "object" &&
    typeof input.name === "string" &&
    !isZodSchema(input)
  );
}

/* ============================================================
 * 归一化
 * ============================================================ */
function normalizeQueryInput(
  input: z.ZodTypeAny | ApiQueryParam | ApiQueryParam[],
): NormalizedQueryInput {
  // 情况 1：zod schema
  if (isZodSchema(input)) {
    return { schema: input as z.ZodTypeAny, params: [] };
  }

  // 情况 2：数组
  if (Array.isArray(input)) {
    return { params: input.filter(isParamDescriptor) };
  }

  // 情况 3：单个对象
  if (isParamDescriptor(input)) {
    return { params: [input] };
  }

  return { params: [] };
}

/* ============================================================
 * ⭐ ApiQuery：支持多种写法
 * ============================================================ */
export function ApiQuery(
  input: z.ZodTypeAny | ApiQueryParam | ApiQueryParam[],
): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const swagger = getSwaggerMetadata(target, propertyKey);

    // 累积
    if (!swagger._queryInputs) swagger._queryInputs = [];

    const normalized = normalizeQueryInput(input);

    // 与已有的合并
    const existing = swagger._queryInputs[0] ?? { params: [] };
    swagger._queryInputs[0] = {
      schema: normalized.schema ?? existing.schema,
      params: [...existing.params, ...normalized.params],
    };

    // 兼容旧逻辑：如果只有一个，直接赋值 swagger.query
    // 完整的合并逻辑放在 router.ts
    setSwaggerMetadata(target, propertyKey, swagger);
    return descriptor;
  };
}

/* ============================================================
 * 其余装饰器保持不变
 * ============================================================ */
export function SwaggerDoc(doc: SwaggerMetadata): MethodDecorator {
  return (target, propertyKey, descriptor) => {
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
  return (target, propertyKey, descriptor) => {
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
  return (target, propertyKey, descriptor) => {
    const swagger = getSwaggerMetadata(target, propertyKey);
    swagger.requestBody = { content: { "application/json": { schema } } };
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

/* ============================================================
 * ⭐ 供 router.ts 调用的合并函数
 * ============================================================ */
export function buildQuerySchema(
  swagger: SwaggerMetadata & { _queryInputs?: NormalizedQueryInput[] },
): z.ZodTypeAny | undefined {
  const inputs = swagger._queryInputs;
  if (!inputs || inputs.length === 0) return undefined;

  const merged = inputs[0];
  const shape: Record<string, z.ZodTypeAny> = {};

  // 1. zod schema 的字段
  if (merged.schema) {
    const zodShape = extractShape(merged.schema);
    Object.assign(shape, zodShape);
  }

  // 2. 对象描述的字段
  for (const p of merged.params) {
    shape[p.name] = paramToZod(p);
  }

  if (Object.keys(shape).length === 0) return undefined;
  return z.object(shape);
}

/** 从 zod object 里拿 shape（兼容 v3 / v4） */
function extractShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  const def: any = (schema as any)._def ?? (schema as any)._zod?.def;
  if (!def) return {};

  // v3：shape 是函数
  if (typeof def.shape === "function") return def.shape();
  // v4：shape 是对象
  if (def.shape && typeof def.shape === "object") return def.shape;
  return {};
}

/** ApiQueryParam → zod schema */
function paramToZod(p: ApiQueryParam): z.ZodTypeAny {
  let field: z.ZodTypeAny;

  switch (p.type) {
    case "number":
      field = z.coerce.number();
      break;
    case "boolean":
      field = z.coerce.boolean();
      break;
    case "array":
      field = z.array(z.string());
      break;
    default:
      field = z.string();
  }

  if (p.enum && p.enum.length > 0) {
    field = z.enum(p.enum as [string, ...string[]]);
  }

  if (p.description) {
    field = field.describe(p.description);
  }

  if (p.default !== undefined) {
    field = field.default(p.default);
  }

  if (!p.required) {
    field = field.optional();
  }

  return field;
}
