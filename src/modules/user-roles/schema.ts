import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CreateUserRoleBody = z
  .object({
    userId: z.string(),
    roleId: z.string(),
  })
  .openapi("CreateUserRoleBody");
