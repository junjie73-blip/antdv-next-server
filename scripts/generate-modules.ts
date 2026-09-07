import { readdirSync, statSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const modulesDir = join(__dirname, "../src/modules");
const outputFile = join(__dirname, "../src/modules/index.ts");

function scanControllers(dir: string): string[] {
  const controllers: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const moduleDir = join(dir, entry.name);

    // 扫描模块目录下所有 *.controller.ts 文件
    const files = readdirSync(moduleDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile()) continue;
      // 匹配 controller.ts 或 *.controller.ts
      if (
        file.name === "controller.ts" ||
        file.name.endsWith(".controller.ts")
      ) {
        const importPath = `./${entry.name}/${basename(file.name, ".ts")}.js`;
        controllers.push(importPath);
      }
    }
  }

  return controllers;
}

function generate() {
  const imports = scanControllers(modulesDir);

  const importLines = imports
    .map((path, i) => `import Controller_${i} from '${path}';`)
    .join("\n");

  const exportLines = imports.map((_, i) => `  Controller_${i},`).join("\n");

  const content = `// 此文件由 scripts/generate-modules.ts 自动生成，请勿手动修改
${importLines}

export const controllers = [
${exportLines}
];
`;

  writeFileSync(outputFile, content, "utf-8");
  console.log(
    `[GenerateModules] ✅ 已生成 ${outputFile}，共 ${imports.length} 个 Controller`,
  );
}

generate();
