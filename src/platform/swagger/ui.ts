import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenAPIDoc } from "./generator.js";

const router = Router();
router.use("/", swaggerUi.serve);
// ✅ 挂载在 /api/docs 下时，内部路径直接用 "/" 和 "/json"
router.get("/", (_req, res, next) => {
  const doc = generateOpenAPIDoc();
  swaggerUi.setup(doc, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Antdv Admin API Docs",
  })(_req, res, next);
});

router.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(generateOpenAPIDoc());
});

export default router;
