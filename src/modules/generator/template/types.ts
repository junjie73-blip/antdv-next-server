export interface GenTemplateEntity {
  template_id: string;
  tenant_id: string;
  template_key: string;
  template_name: string;
  category: string;
  current_version: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

export interface GenTemplateVersionEntity {
  version_id: string;
  template_id: string;
  tenant_id: string;
  version: number;
  content: string;
  changelog: string | null;
  is_current: number;
  created_at: Date;
  created_by: string | null;
}
