// scripts/generate-modules.ts
import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative, sep } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const MODULES_DIR = join(ROOT, "src", "modules");
const OUTPUT_FILE = join(MODULES_DIR, "index.ts");

// ─────────────────────────────────────────────
// 配置：忽略的目录 / 文件
// ─────────────────────────────────────────────

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "__tests__",
  "__mocks__",
  "test",
  "tests",
  "dto",
  "types",
  "schemas",
  "templates",
]);

const IGNORED_SUFFIXES = [".test.ts", ".spec.ts", ".integration.ts", ".d.ts"];

// ─────────────────────────────────────────────
// 扫描
// ─────────────────────────────────────────────

function isControllerFile(name: string): boolean {
  if (!name.endsWith(".ts")) return false;
  if (IGNORED_SUFFIXES.some((s) => name.endsWith(s))) return false;
  return name === "controller.ts" || name.endsWith(".controller.ts");
}

function walk(dir: string, acc: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(full, acc);
    } else if (entry.isFile() && isControllerFile(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

// ─────────────────────────────────────────────
// 路径 → 标识符 / import 路径
// ─────────────────────────────────────────────

function deriveIdentifier(absPath: string): string {
  const rel = relative(MODULES_DIR, absPath).split(sep).join("/");
  const parts = rel
    .replace(/\.ts$/, "")
    .split("/")
    .filter((p) => p !== "controller" && p !== "controllers");

  const name = parts
    .map((p) => p.replace(/\.controller$/, ""))
    .filter(Boolean)
    .flatMap((p) => p.split(/[-_]/))
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

  return `${name}Controller`;
}

function toImportPath(absPath: string): string {
  const rel = relative(MODULES_DIR, absPath).split(sep).join("/");
  return `./${rel.replace(/\.ts$/, ".js")}`;
}

// ─────────────────────────────────────────────
// 内容 hash
// ─────────────────────────────────────────────

/** 对文件内容取 sha256，截断到 16 位，用于感知内部实现变化 */
function hashFile(absPath: string): string {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex").slice(0, 16);
}

// ─────────────────────────────────────────────
// 收集 + 校验
// ─────────────────────────────────────────────

interface ControllerEntry {
  identifier: string;
  importPath: string;
  absPath: string;
  hash: string;
}

function collectControllers(): ControllerEntry[] {
  const files = walk(MODULES_DIR);

  const entries: ControllerEntry[] = files
    .map((absPath) => ({
      identifier: deriveIdentifier(absPath),
      importPath: toImportPath(absPath),
      absPath,
      hash: hashFile(absPath),
    }))
    .sort((a, b) => a.importPath.localeCompare(b.importPath));

  const seen = new Map<string, string>();
  for (const e of entries) {
    if (seen.has(e.identifier)) {
      throw new Error(
        `[GenerateModules] 标识符冲突: ${e.identifier}\n` +
          `  - ${seen.get(e.identifier)}\n` +
          `  - ${e.importPath}\n` +
          `请重命名其中一个 controller 文件，或让目录结构更明确。`,
      );
    }
    seen.set(e.identifier, e.importPath);
  }

  return entries;
}

// ─────────────────────────────────────────────
// 生成内容
// ─────────────────────────────────────────────

function buildContent(entries: ControllerEntry[]): string {
  const header = `// ⚠️ 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改。
// 重新生成: pnpm generate:modules
// CI 校验: pnpm generate:modules:check
//
// 末尾的 hash 块用于感知 controller 文件内部实现的变化，
// 每次内容变化都会触发此文件重写。`;

  if (entries.length === 0) {
    return `${header}

export const controllers = [] as const;

// ---- controller content hashes (sha256, 16 hex chars) ----
`;
  }

  const imports = entries.map((e) => `import ${e.identifier} from "${e.importPath}";`).join("\n");

  const list = entries.map((e) => `  ${e.identifier},`).join("\n");

  const hashBlock = entries.map((e) => `// ${e.importPath}  ${e.hash}`).join("\n");

  return `${header}

${imports}

export const controllers = [
${list}
] as const;

// ---- controller content hashes (sha256, 16 hex chars) ----
${hashBlock}
`;
}

/** 从生成内容中提取 { importPath -> hash } */
function extractHashes(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /^\/\/\s+(\S+)\s+([0-9a-f]{16})$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

function diffHashes(prev: string, next: string) {
  const p = extractHashes(prev);
  const n = extractHashes(next);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const k of Object.keys(n)) {
    if (!(k in p)) added.push(k);
    else if (p[k] !== n[k]) changed.push(k);
  }
  for (const k of Object.keys(p)) {
    if (!(k in n)) removed.push(k);
  }
  return { added, removed, changed };
}

// ─────────────────────────────────────────────
// 主流程
// ─────────────────────────────────────────────

function main(): void {
  const args = process.argv.slice(2);
  const checkMode = args.includes("--check");
  const dryRun = args.includes("--dry-run");

  let entries: ControllerEntry[];
  try {
    entries = collectControllers();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const content = buildContent(entries);
  const prev = existsSync(OUTPUT_FILE) ? readFileSync(OUTPUT_FILE, "utf-8") : "";

  // ① CI 校验
  if (checkMode) {
    if (prev !== content) {
      console.error(
        `[GenerateModules] ❌ ${relative(ROOT, OUTPUT_FILE)} 与磁盘上的 Controller 不一致。`,
      );
      const { added, removed, changed } = diffHashes(prev, content);
      if (added.length) console.error(`  + 新增: ${added.join(", ")}`);
      if (removed.length) console.error(`  - 删除: ${removed.join(", ")}`);
      if (changed.length) console.error(`  ~ 内容变化: ${changed.join(", ")}`);
      console.error("请运行: pnpm generate:modules");
      process.exit(1);
    }
    console.log(`[GenerateModules] ✅ 一致（${entries.length} 个 Controller）`);
    return;
  }

  // ② dry-run
  if (dryRun) {
    console.log(content);
    console.log(`[GenerateModules] 🧪 dry-run：共 ${entries.length} 个 Controller`);
    const { added, removed, changed } = diffHashes(prev, content);
    if (added.length) console.log(`  + 新增: ${added.join(", ")}`);
    if (removed.length) console.log(`  - 删除: ${removed.join(", ")}`);
    if (changed.length) console.log(`  ~ 内容变化: ${changed.join(", ")}`);
    return;
  }

  // ③ 幂等
  if (prev === content) {
    console.log(`[GenerateModules] ⏭  无变化（${entries.length} 个 Controller）`);
    return;
  }

  // ④ 写盘
  writeFileSync(OUTPUT_FILE, content, "utf-8");
  console.log(
    `[GenerateModules] ✅ 已生成 ${relative(ROOT, OUTPUT_FILE)}，共 ${entries.length} 个 Controller`,
  );

  const { added, removed, changed } = diffHashes(prev, content);
  // if (added.length) console.log(`  + 新增: ${added.join(", ")}`);
  // if (removed.length) console.log(`  - 删除: ${removed.join(", ")}`);
  if (changed.length) console.log(`  ~ 内容变化: ${changed.join(", ")}`);
}

main();
