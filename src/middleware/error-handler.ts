import type {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import { logger } from "@common/logger/index.js";
import { ZodError } from "zod";
import { error } from "@common/utils/response.js";
export function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction,
): ExResponse | void {
  logger.error(err);
  if (err instanceof ZodError) {
    console.warn(`Caught Zod Validation Error for ${req.path}:`, err);
    return res.status(422).json(
      error(
        {
          details: err.issues.map((issue) => issue.message).join(","),
        },
        "Validation Failed",
        422,
      ),
    );
  }
  if (err instanceof Error) {
    return res.status(500).json(error(null, "Internal Server Error", 500));
  }

  next();
}
