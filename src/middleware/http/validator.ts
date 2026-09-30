import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { AppError } from "@/core/errors.js";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validateRequest(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        req.body = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        next(new AppError(msg, 400001, 400));
        return;
      }
      next(err);
    }
  };
}
