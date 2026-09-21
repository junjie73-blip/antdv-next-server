import "reflect-metadata";
import { ControllerScanner } from "@/core/decorator/scanner.js";
import { controllers } from "@/modules/index.js";
import { registry } from "@/platform/swagger/registry.js";

function describeSchema(schema: any, depth = 0): string {
  if (schema == null) return String(schema);
  if (typeof schema !== "object") return typeof schema;
  if (depth > 3) return "...";

  if (schema.shape && typeof schema.shape === "object") {
    const keys = Object.keys(schema.shape);
    return `ZodObject{${keys.join(",")}}`;
  }
  if (schema.def?.innerType) {
    return `Zod${(schema.type as string).charAt(0).toUpperCase() + schema.type.slice(1)}<${describeSchema(schema.def.innerType, depth + 1)}>`;
  }
  if (schema.type === "array" && schema.def?.element) {
    return `ZodArray<${describeSchema(schema.def.element, depth + 1)}>`;
  }
  return schema.type ?? "unknown";
}

const scanner = new ControllerScanner();
scanner.register(...(controllers as any));

let ok = 0;
let bad = 0;

for (const ctrl of scanner.scan()) {
  for (const route of ctrl.routes) {
    if (!route.swagger) continue;

    const path = `${ctrl.prefix}${route.path}`.replace(/:([^/]+)/g, "{$1}");
    const label = `${route.method.toUpperCase().padEnd(6)} ${path.padEnd(40)} ${ctrl.target.name}.${String(route.propertyKey)}`;

    const request: Record<string, unknown> = {};
    if (route.swagger.requestBody != null)
      request.body = route.swagger.requestBody;
    if (route.swagger.query != null) request.query = route.swagger.query;
    if (route.swagger.params != null) request.params = route.swagger.params;

    try {
      registry.registerPath({
        method: route.method as any,
        path,
        tags: ctrl.tags,
        summary: route.swagger.summary,
        request: Object.keys(request).length > 0 ? request : undefined,
        responses: route.swagger.responses ?? {
          200: { description: "Success" },
        },
      });
      console.log(`✅ ${label}`);
      if (route.swagger.requestBody)
        console.log(
          `       body  : ${describeSchema(route.swagger.requestBody)}`,
        );
      if (route.swagger.query)
        console.log(`       query : ${describeSchema(route.swagger.query)}`);
      ok++;
    } catch (err: any) {
      bad++;
      console.error(`❌ ${label}`);
      console.error(`       err   : ${err.message}`);
      console.error(
        `       body  : ${route.swagger.requestBody ? describeSchema(route.swagger.requestBody) : "(none)"}`,
      );
      console.error(
        `       query : ${route.swagger.query ? describeSchema(route.swagger.query) : "(none)"}`,
      );
      console.error(
        `       params: ${route.swagger.params ? describeSchema(route.swagger.params) : "(none)"}`,
      );
    }
  }
}

console.log(`\n=== 汇总 ===`);
console.log(`✅ 成功: ${ok}`);
console.log(`❌ 失败: ${bad}`);
process.exit(bad > 0 ? 1 : 0);
