export interface FieldMaskPolicyEntity {
  policy_id: string;
  tenant_id: string;
  resource: string;
  field: string;
  role_scope: string;
  mask_type: string;
  mask_rule: string | null;
  enabled: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

/** 缓存里存的结构：resource → field → { roleScope → policy } */
export type PolicyMap = Record<
  string,
  Record<string, Record<string, { type: string; rule: string | null }>>
>;
