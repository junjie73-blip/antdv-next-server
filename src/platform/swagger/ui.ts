import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { generateOpenAPIDoc } from "./generator.js";

const router = Router();

router.use("/docs", swaggerUi.serve);
router.get("/docs", (req, res, next) => {
  const swaggerDocument = generateOpenAPIDoc();
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Antdv Admin API Docs",
  })(req, res, next);
});

router.get("/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(generateOpenAPIDoc());
});

export default router;
