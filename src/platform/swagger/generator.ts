import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";

export function generateOpenAPIDoc() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Antdv Next Admin API",
      description:
        "Multi-tenant Antdv Next Admin Backend API with RBAC, MFA, and Audit Logging",
    },
    servers: [{ url: "/api/v1" }],
  });
}
