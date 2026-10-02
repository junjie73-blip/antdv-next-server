// src/modules/monitor/slow-query/schema.ts
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { SLOW_QUERY_STATUS, MAX_PAGE_SIZE } from "./constants.js";

extendZodWithOpenApi(z);

const StatusEnum = z.enum([
  SLOW_QUERY_STATUS.OPEN,
  SLOW_QUERY_STATUS.RESOLVED,
  SLOW_QUERY_STATUS.IGNORED,
]);

export const SlowQueryListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
    keyword: z.string().max(256).optional(),
    status: StatusEnum.optional(),
    minMeanMs: z.coerce.number().int().min(0).optional(),
    minTotalMs: z.coerce.number().int().min(0).optional(),
    tenantId: z.string().uuid().optional(),
    orderBy: z.enum(["mean", "total", "calls", "last_seen"]).default("mean"),
  })
  .openapi("SlowQueryList");

export const SlowQueryReviewSchema = z
  .object({
    status: z.enum([SLOW_QUERY_STATUS.RESOLVED, SLOW_QUERY_STATUS.IGNORED]),
    note: z.string().max(1000).optional(),
  })
  .openapi("SlowQueryReview");

export type SlowQueryListDTO = z.infer<typeof SlowQueryListSchema>;
export type SlowQueryReviewDTO = z.infer<typeof SlowQueryReviewSchema>;
