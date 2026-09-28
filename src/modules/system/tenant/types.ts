/** 租户实体（简化） */
export interface TenantEntity {
  tenant_id: string;
  tenant_code: string;
  tenant_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: string;
  expire_time: Date | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: number;
}

/** 租户下拉选项（返回给前端） */
export interface TenantOption {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
}
