import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export function createRegistry() {
  return new OpenAPIRegistry();
}

export function mountSwagger(app: Express, registry: OpenAPIRegistry) {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "API 文档",
      version: "1.0.0",
      description: "Antdv-next admin 文档",
    },
    servers: [
      {
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  });

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(document));
}
