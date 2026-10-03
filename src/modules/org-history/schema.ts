import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
extendZodWithOpenApi(z);

export const OrgHistoryListSchema = z
  .object({
    entityType: z.enum(["dept", "user", "user_dept", "user_role"]).optional(),
    entityId: z.string().uuid().optional(),
    scope: z
      .enum(["dept_tree", "user_profile", "user_dept", "user_role", "position"])
      .optional(),
    changeType: z
      .enum([
        "create",
        "update",
        "delete",
        "move",
        "transfer",
        "assign",
        "revoke",
      ])
      .optional(),
    operatorId: z.string().uuid().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    pageNum: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(20),
  })
  .openapi("OrgHistoryList");

export type OrgHistoryListDTO = z.infer<typeof OrgHistoryListSchema>;
