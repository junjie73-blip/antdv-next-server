import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export type ExpressMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;
export type ExpressHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => any;

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    username: string;
    roles: string[];
  };
}

export interface ValidationSchema {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
}

export interface RouteDefinition {
  method: string;
  path: string;
  handler: string;
  middlewares: ExpressMiddleware[];
  swagger?: any;
  validate?: ValidationSchema;
  permission?: { resource: string; action: string };
}
