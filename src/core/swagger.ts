import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { writeFileSync } from "fs";
import { resolve } from "path";

extendZodWithOpenApi(z);

let cachedDocument: any = null;

export function createRegistry() {
  return new OpenAPIRegistry();
}

export function generateDocument(registry: OpenAPIRegistry) {
  if (cachedDocument) return cachedDocument;

  const generator = new OpenApiGeneratorV3(registry.definitions);

  cachedDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Antdv-next Admin API",
      version: "1.0.0",
      description: "Antdv-next admin 后台管理 API 文档",
    },
    servers: [
      {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  });

  return cachedDocument;
}

export function mountSwagger(app: Express, registry: OpenAPIRegistry) {
  const document = generateDocument(registry);

  // Swagger UI 页面
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(document));

  // JSON 格式 API 文档（动态获取）
  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(document, null, 2));
  });
}

// 导出为静态 JSON 文件（构建时调用）
export function exportSwaggerJson(
  registry: OpenAPIRegistry,
  outputPath?: string,
) {
  const document = generateDocument(registry);
  const filePath = outputPath || resolve(process.cwd(), "swagger.json");
  writeFileSync(filePath, JSON.stringify(document, null, 2), "utf-8");
  console.log(`✅ Swagger JSON 已导出: ${filePath}`);
  return filePath;
}
