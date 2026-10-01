import { Router, type Request, type Response } from "express";
import express from "express";
import { getAbsoluteFSPath } from "swagger-ui-dist";
import { generateOpenAPIDoc } from "./generator.js";
import { logger } from "@/platform/logger/index.js";

const SITE_TITLE = "Antdv Admin API Docs";
const CUSTOM_CSS = ".swagger-ui .topbar { display: none }";

/* ============================================================
 * HTML 模板
 * ============================================================ */
function buildSwaggerHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${SITE_TITLE}</title>
  <link rel="stylesheet" href="./swagger-ui.css" />
  <link rel="icon" type="image/png" href="./favicon-32x32.png" />
  <style>${CUSTOM_CSS}</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="./swagger-ui-bundle.js" crossorigin></script>
  <script src="./swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        filter: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        requestInterceptor: (req) => {
          try {
            const token = localStorage.getItem('accessToken')
              || localStorage.getItem('access_token')
              || localStorage.getItem('token');
            if (token) req.headers['Authorization'] = 'Bearer ' + token;
          } catch (e) {}
          return req;
        },
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
        onComplete: () => {
          console.log('[swagger] UI loaded');
        },
        onFailure: (err) => {
          console.error('[swagger] load failed:', err);
        },
      });
    };
  </script>
</body>
</html>`;
}

/* ============================================================
 * Router
 * ============================================================ */
const router = Router();

// ============================================================
// ⭐ 关键：JSON 和 HTML 路由必须放在 static 之前
// ============================================================

/* ---------- 1. OpenAPI JSON ---------- */
router.get("/json", (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    const doc = generateOpenAPIDoc();

    // 打印基本信息，便于排查
    const pathCount = Object.keys((doc as any).paths ?? {}).length;
    logger.info(
      { pathCount, duration: Date.now() - start },
      "[swagger] OpenAPI 生成成功",
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store"); // 调试期禁缓存
    res.send(doc);
  } catch (err) {
    // ⭐ 打印完整错误堆栈，便于定位
    logger.error({ err }, "[swagger] OpenAPI 生成失败");

    res.status(500).json({
      code: 500,
      message: "OpenAPI 生成失败",
      error: err instanceof Error ? err.message : String(err),
      stack:
        err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
    });
  }
});

/* ---------- 2. UI 页面 ---------- */
router.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(buildSwaggerHtml("./json"));
});

/* ---------- 3. 静态资源（放在最后） ---------- */
let staticDir = "";
try {
  staticDir = getAbsoluteFSPath();
  logger.info({ staticDir }, "[swagger] static dir resolved");
} catch (err) {
  logger.error({ err }, "[swagger] getAbsoluteFSPath 失败");
}

if (staticDir) {
  // 排除 /json 和 / 路径，其他走 static
  router.use(
    express.static(staticDir, {
      index: false,
      maxAge: "1d",
      fallthrough: true, // 找不到文件时继续往后走
    }),
  );
}

export default router;
