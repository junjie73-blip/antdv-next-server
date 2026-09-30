import express, { type Express } from "express";
import helmet from "helmet";
import { healthRouter } from "./middleware/health.js";

export function createHttpApp(): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);

  // 404
  app.use((_req, res) => {
    res.status(404).json({
      code: 404001,
      message: "not found",
      data: null,
      timestamp: Date.now(),
    });
  });

  return app;
}
