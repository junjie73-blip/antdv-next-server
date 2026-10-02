import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ABNORMAL_TYPE } from "./constants.js";

extendZodWithOpenApi(z);

export const MyLoginLogListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    onlyAbnormal: z.coerce.number().int().min(0).max(1).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  })
  .openapi("MyLoginLogList");

export const AbnormalLogListSchema = z
  .object({
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().uuid().optional(),
    abnormalType: z
      .enum(Object.values(ABNORMAL_TYPE) as [string, ...string[]])
      .optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
  })
  .openapi("AbnormalLogList");

export type MyLoginLogListDTO = z.infer<typeof MyLoginLogListSchema>;
export type AbnormalLogListDTO = z.infer<typeof AbnormalLogListSchema>;
