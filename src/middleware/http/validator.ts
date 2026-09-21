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
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
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
