import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "src";

interface Violation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const violations: Violation[] = [];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * 规则：
 * 1. SQL 模板中出现 `${xxx}` 且 xxx 是数组（无法静态识别），
 *    但同段代码里调用了 .map / Array.isArray 等数组操作，则需警告
 * 2. 使用 `ANY(${x})` / `IN (${x})` 且未见 `Prisma.join` / `Prisma.sql` 兜底
 * 3. 使用 `$queryRawUnsafe` / `$executeRawUnsafe` 且拼接了变量（非白名单）
 */
function analyze(file: string): void {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 规则 1/2：ANY / IN 中的模板变量未用 Prisma.join
    if (/\b(ANY|IN)\s*\(\s*\$\{[^}]+\}/.test(line)) {
      const nearby = lines.slice(Math.max(0, i - 1), i + 2).join("\n");
      if (!nearby.includes("Prisma.join") && !nearby.includes("Prisma.sql")) {
        violations.push({
          file,
          line: lineNum,
          snippet: line.trim(),
          reason: "ANY/IN 中疑似数组参数未用 Prisma.join 展开",
        });
      }
    }

    // 规则 3：Unsafe 且拼接变量（排除已使用白名单校验的场景）
    if (/\$queryRawUnsafe|\$executeRawUnsafe/.test(line)) {
      // 若同一函数体内含 assertAllowedTable / PART_NAME_RE / IDENT_RE 等校验，视为通过
      const functionBlock = extractFunctionBlock(lines, i);
      const hasGuard =
        /assertAllowedTable|PART_NAME_RE|IDENT_RE|assertSafePrefix|assertSafeKey/.test(
          functionBlock,
        );
      // 检测是否在模板字符串里直接插入变量
      if (/\$\{/.test(line) && !hasGuard) {
        violations.push({
          file,
          line: lineNum,
          snippet: line.trim(),
          reason: "Unsafe raw SQL 中插入变量，未检测到白名单校验",
        });
      }
    }
  }
}

/** 粗略提取当前函数体（往上/下各 30 行） */
function extractFunctionBlock(lines: string[], at: number): string {
  return lines
    .slice(Math.max(0, at - 30), Math.min(lines.length, at + 30))
    .join("\n");
}

const files = walk(ROOT);
for (const f of files) {
  try {
    statSync(f);
    analyze(f);
  } catch {
    // ignore
  }
}

if (violations.length === 0) {
  console.log("✅ 无可疑 raw SQL 数组参数");
  process.exit(0);
}

console.error(`❌ 发现 ${violations.length} 处可疑 raw SQL：`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    原因：${v.reason}`);
  console.error(`    代码：${v.snippet}`);
}
process.exit(1);
