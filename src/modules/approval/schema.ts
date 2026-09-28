import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CreateApprovalSchema = z
  .object({
    title: z.string().min(1).max(256),
    content: z.string().max(2000).optional(),
    formData: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("CreateApproval");

export const ApproveSchema = z
  .object({
    remark: z.string().max(512).optional(),
  })
  .openapi("Approve");

export const RejectSchema = z
  .object({
    reasonType: z.string().min(1).max(64),
    remark: z.string().min(5).max(500),
  })
  .openapi("Reject");

export const ApprovalLogQuerySchema = z
  .object({
    title: z.string().max(256).optional(),
    action: z.enum(["SUBMIT", "APPROVE", "REJECT", "RESUBMIT"]).optional(),
    operatorName: z.string().max(64).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ApprovalLogQuery");

export const ApprovalFlowQuerySchema = z
  .object({
    title: z.string().max(256).optional(),
    status: z.enum(["0", "1", "2", "3"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ApprovalFlowQuery");

export const ApprovalTaskQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .openapi("ApprovalTaskQuery");

export type CreateApprovalDTO = z.infer<typeof CreateApprovalSchema>;
export type ApproveDTO = z.infer<typeof ApproveSchema>;
export type RejectDTO = z.infer<typeof RejectSchema>;
export type ApprovalLogQueryDTO = z.infer<typeof ApprovalLogQuerySchema>;
export type ApprovalFlowQueryDTO = z.infer<typeof ApprovalFlowQuerySchema>;
