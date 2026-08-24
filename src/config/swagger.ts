import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { BaseController } from "@/common/core/base-controller.js";
import { Dirent } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 自动扫描 src/modules/ 下所有 controller.ts
 * 约定：每个模块目录下必须有 controller.ts，且默认导出一个继承 BaseController 的类
 */
export async function loadControllers(): Promise<BaseController[]> {
  const controllers: BaseController[] = [];
  const modulesDir = join(__dirname, "modules");

  let entries: Dirent<string>[];
  try {
    entries = await readdir(modulesDir, { withFileTypes: true });
  } catch {
    console.warn("[Modules] 未找到 modules 目录，跳过自动扫描");
    return controllers;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const moduleName = entry.name;
    const controllerPath = join(modulesDir, moduleName, "controller.ts");

    try {
      // ESM 动态导入，必须加 .js（即使源文件是 .ts）
      const modulePath = `./modules/${moduleName}/controller.js`;
      const mod = await import(modulePath);

      // 优先取 default export，否则取第一个导出的类
      const ControllerClass =
        mod.default ||
        Object.values(mod).find(
          (exp): exp is new () => BaseController =>
            typeof exp === "function" && exp.prototype?.constructor,
        );

      if (!ControllerClass) {
        console.warn(
          `[Modules] ${moduleName}/controller.ts 未找到有效的 Controller 类`,
        );
        continue;
      }

      const instance = new ControllerClass();
      controllers.push(instance);
      console.log(
        `[Modules] ✅ 已加载: ${ControllerClass.name} (${moduleName})`,
      );
    } catch (err: any) {
      // controller.ts 不存在或导入失败，静默跳过（非所有目录都需要 controller）
      if (err.code !== "ERR_MODULE_NOT_FOUND") {
        console.error(
          `[Modules] ❌ 加载 ${moduleName}/controller.ts 失败:`,
          err.message,
        );
      }
    }
  }

  return controllers;
}
