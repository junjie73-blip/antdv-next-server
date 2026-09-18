import Handlebars from "handlebars";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@/core/logger/index.js";
import { AppError } from "@/core/errors.js";

const TEMPLATE_ROOT = path.join(import.meta.dirname, "../templates");
const cache = new Map<string, HandlebarsTemplateDelegate>();

// ---------- Helpers ----------
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
Handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
Handlebars.registerHelper("or", (...args: unknown[]) =>
  args.slice(0, -1).some(Boolean),
);
Handlebars.registerHelper("and", (...args: unknown[]) =>
  args.slice(0, -1).every(Boolean),
);
Handlebars.registerHelper("lowerFirst", (s: string) =>
  s ? s.charAt(0).toLowerCase() + s.slice(1) : s,
);
Handlebars.registerHelper("upperFirst", (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s,
);
Handlebars.registerHelper("camelCase", (s: string) =>
  String(s).replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()),
);

/** 渲染模板（带缓存） */
export function renderTemplate(
  relPath: string,
  ctx: Record<string, unknown>,
): string {
  let tpl = cache.get(relPath);
  if (!tpl) {
    const abs = path.join(TEMPLATE_ROOT, relPath);
    if (!fs.existsSync(abs)) {
      throw new AppError(`模板不存在: ${relPath}`, 404001, 404);
    }
    tpl = Handlebars.compile(fs.readFileSync(abs, "utf8"), { noEscape: true });
    cache.set(relPath, tpl);
    logger.debug({ relPath }, "[generator] template compiled");
  }
  return tpl(ctx);
}

/** 开发时热重载用 */
export function clearTemplateCache(): void {
  cache.clear();
}
