import { readFileSync, readdirSync } from "fs";
import { join } from "path";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) out.push(...walk(p));
    else if (f.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const files = walk("src");
let issues = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    // 检测 ${xxxArray} 直接进 SQL，未用 Prisma.join
    if (/\$\{[a-zA-Z_]\w*\}/.test(line) && /ANY|IN\s*\(/.test(line)) {
      if (!line.includes("Prisma.join") && !line.includes("Prisma.sql")) {
        console.error(`${file}:${i + 1}: 疑似数组参数未展开 → ${line.trim()}`);
        issues++;
      }
    }
  });
}

if (issues > 0) {
  console.error(`\n发现 ${issues} 处可疑 raw SQL 数组参数`);
  process.exit(1);
}
console.log("✅ 无可疑 raw SQL 数组参数");
