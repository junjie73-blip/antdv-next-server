import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "../src/platform/swagger/registry.js";

interface Definition {
  type?: string;
  name?: string;
  method?: string;
  path?: string;
  schema?: any;
  [k: string]: any;
}

const DOC_CONFIG = {
  openapi: "3.0.0",
  info: { version: "1.0.0", title: "Test", description: "Test" },
};

/** 尝试生成，返回是否成功 */
function tryGenerate(defs: Definition[]): { ok: boolean; error?: Error } {
  try {
    const gen = new OpenApiGeneratorV3(defs as any);
    gen.generateDocument(DOC_CONFIG as any);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err as Error };
  }
}

/** 判断错误是否是我们要定位的 'parent' 错误 */
function isTargetError(err?: Error): boolean {
  if (!err) return false;
  return err.message.includes("parent") || err.message.includes("undefined");
}

/** 二分法找出有问题的 definition */
function bisect(defs: Definition[], depth = 0): Definition[] {
  if (defs.length === 0) return [];

  // 单个 definition
  if (defs.length === 1) {
    const r = tryGenerate(defs);
    return r.ok ? [] : [defs[0]];
  }

  // 整体测试
  const full = tryGenerate(defs);
  if (full.ok) return [];

  // 分裂
  const mid = Math.floor(defs.length / 2);
  const left = defs.slice(0, mid);
  const right = defs.slice(mid);

  return [...bisect(left, depth + 1), ...bisect(right, depth + 1)];
}

async function diagnose() {
  const defs = (registry as any).definitions as Definition[];

  console.log("\n========== Swagger Schema 诊断 ==========\n");
  console.log(`📊 共 ${defs.length} 条 definition\n`);

  // 分类统计
  const schemas = defs.filter((d) => d.type === "schema");
  const paths = defs.filter((d) => d.type === "path");
  const others = defs.filter((d) => d.type !== "schema" && d.type !== "path");

  console.log(`  Schema: ${schemas.length}`);
  console.log(`  Path:   ${paths.length}`);
  console.log(`  其他:   ${others.length}\n`);

  // ============================================================
  // 1. 先测整体
  // ============================================================
  const fullResult = tryGenerate(defs);
  if (fullResult.ok) {
    console.log("✅ 全部 definition 生成成功，未发现问题\n");
    return;
  }

  console.log("❌ 整体生成失败：", fullResult.error?.message);
  console.log("   开始二分定位...\n");

  // ============================================================
  // 2. 二分法定位
  // ============================================================
  const badDefs = bisect(defs);

  console.log("\n========== 定位结果 ==========\n");
  if (badDefs.length === 0) {
    console.log("⚠️  未定位到具体条目，可能是组合触发的问题");
    console.log("   尝试逐个测试每个 path");
    testEachPath(paths);
    return;
  }

  console.log(`🎯 找到 ${badDefs.length} 个可疑 definition：\n`);
  for (const d of badDefs) {
    console.log(`------------------------------------------`);
    console.log(`type:   ${d.type}`);
    if (d.name) console.log(`name:   ${d.name}`);
    if (d.method && d.path)
      console.log(`path:   ${d.method.toUpperCase()} ${d.path}`);
    console.log(`keys:   ${Object.keys(d).join(", ")}`);
    // 打印 schema 关键信息
    if (d.schema) {
      console.log(`schema: ${describeSchema(d.schema)}`);
    }
    // 打印 route 里的 requestBody / query
    if (d.route) {
      if (d.route.requestBody)
        console.log(`body:   ${describeSchema(d.route.requestBody)}`);
      if (d.route.query)
        console.log(`query:  ${describeSchema(d.route.query)}`);
      if (d.route.responses) {
        for (const [status, resp] of Object.entries(d.route.responses)) {
          const schema = (resp as any)?.content?.["application/json"]?.schema;
          if (schema) console.log(`resp[${status}]: ${describeSchema(schema)}`);
        }
      }
    }
    console.log("");
  }
}

/** 逐个 path 单独测试 */
function testEachPath(paths: Definition[]) {
  console.log("\n---------- 逐个 Path 测试 ----------\n");
  for (const p of paths) {
    const r = tryGenerate([p]);
    if (!r.ok && isTargetError(r.error)) {
      console.log(`❌ ${p.method?.toUpperCase()} ${p.path}`);
      console.log(`   ${r.error?.message}\n`);
    }
  }
}

/** 描述 zod schema 的类型 */
function describeSchema(schema: any): string {
  if (!schema) return "(空)";
  const def = schema._def ?? schema._zod?.def;
  if (!def) return "(无 _def)";

  const typeName = def.typeName ?? def.type ?? "未知";
  const inner = def.innerType ?? def.element ?? def.schema;

  let result = typeName;
  if (inner) result += ` ← ${describeSchema(inner)}`;
  return result;
}

diagnose().catch(console.error);
