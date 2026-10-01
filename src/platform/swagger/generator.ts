import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";
import { logger } from "@/platform/logger/index.js";

export function generateOpenAPIDoc() {
  const defs = registry.definitions;

  // ============================================================
  // ⭐ 1. 打印所有 definition 摘要
  // ============================================================
  logger.info({ count: defs.length }, "[swagger] 开始诊断");

  defs.forEach((d: any, i: number) => {
    const summary = describeDefinition(d);
    logger.info(`[${i}/${defs.length}] ${summary}`);
  });

  // ============================================================
  // ⭐ 2. 逐条累加测试，找出崩溃点
  // ============================================================
  const DOC_CONFIG = {
    openapi: "3.0.0",
    info: { version: "1.0.0", title: "Test", description: "Test" },
  };

  for (let i = 0; i < defs.length; i++) {
    const accumulated = defs.slice(0, i + 1);
    try {
      const gen = new OpenApiGeneratorV3(accumulated);
      gen.generateDocument(DOC_CONFIG as any);
    } catch (err) {
      const target = defs[i];
      logger.error(
        {
          index: i,
          total: defs.length,
          definition: describeDefinition(target, true),
          error: err instanceof Error ? err.message : String(err),
        },
        `[swagger] ❌ 崩溃点：${describeDefinition(target)}`,
      );
      // 继续抛错，让上层返回 500
      throw new Error(
        `Swagger 生成失败，问题条目 [${i}]：${describeDefinition(target)}。原始错误：${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ============================================================
  // ⭐ 3. 全部通过，正式生成
  // ============================================================
  const generator = new OpenApiGeneratorV3(defs);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Antdv Next Admin API",
      description: "Multi-tenant backend API",
    },
    servers: [{ url: "/api/v1", description: "业务 API" }],
  });
}

/** 描述一条 definition */
function describeDefinition(d: any, verbose = false): string {
  if (!d) return "(空)";

  if (d.type === "path") {
    const parts = [`PATH ${d.method?.toUpperCase()} ${d.path}`];
    if (verbose) {
      if (d.route?.requestBody)
        parts.push(`  body: ${describeSchema(d.route.requestBody)}`);
      if (d.route?.query)
        parts.push(`  query: ${describeSchema(d.route.query)}`);
      if (d.route?.responses) {
        for (const [k, v] of Object.entries(d.route.responses)) {
          const schema = (v as any)?.content?.["application/json"]?.schema;
          if (schema) parts.push(`  resp[${k}]: ${describeSchema(schema)}`);
        }
      }
    }
    return parts.join("\n");
  }

  if (d.type === "schema") {
    return `SCHEMA ${d.name}: ${describeSchema(d.schema)}`;
  }

  return `OTHER ${JSON.stringify(d).slice(0, 200)}`;
}

/** 描述 zod schema 的类型链 */
function describeSchema(schema: any, depth = 0): string {
  if (!schema || depth > 10) return "(空)";
  const def = schema._def ?? schema._zod?.def;
  if (!def) return "(无 _def)";

  const typeName = def.typeName ?? def.type ?? "未知";

  // 特殊类型 → 输出额外信息
  if (typeName === "ZodRecord" || typeName === "record") {
    const v = def.valueType ?? def.valueSchema;
    return `ZodRecord<${describeSchema(v, depth + 1)}>`;
  }
  if (typeName === "ZodLazy" || typeName === "lazy") {
    return "ZodLazy(⚠️ 不兼容)";
  }
  if (typeName === "ZodEffects" || typeName === "effects") {
    return `ZodEffects(⚠️ .transform/.refine)`;
  }
  if (typeName === "ZodBranded" || typeName === "branded") {
    return `ZodBranded(⚠️ .brand)`;
  }
  if (typeName === "ZodDate" || typeName === "date") {
    return "ZodDate(⚠️ 用 .datetime 替代)";
  }
  if (typeName === "ZodAny" || typeName === "any") {
    return "ZodAny(⚠️ 加 .openapi 覆盖)";
  }
  if (typeName === "ZodUnknown" || typeName === "unknown") {
    return "ZodUnknown(⚠️ 加 .openapi 覆盖)";
  }
  if (typeName === "ZodBigInt" || typeName === "bigint") {
    return "ZodBigInt(⚠️ 不兼容)";
  }

  // 递归描述内部类型
  const inner = def.innerType ?? def.element ?? def.items ?? def.schema;
  if (
    inner &&
    [
      "ZodOptional",
      "ZodNullable",
      "ZodDefault",
      "ZodArray",
      "ZodCatch",
    ].includes(typeName)
  ) {
    return `${typeName}(${describeSchema(inner, depth + 1)})`;
  }

  return typeName;
}
