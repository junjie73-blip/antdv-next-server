import { readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const modulesDir = join(__dirname, "../src/modules");
const outputFile = join(__dirname, "../src/modules/index.ts");

function scanControllers(dir: string): string[] {
  const controllers: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const controllerPath = join(dir, entry.name, "controller.ts");
    try {
      statSync(controllerPath);
      // 使用相对路径，确保生成的 import 路径正确
      const importPath = `./${entry.name}/controller.js`;
      controllers.push(importPath);
    } catch {
      // 该目录下没有 controller.ts，跳过
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
