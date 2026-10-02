export interface UserGroupEntity {
  group_id: string;
  tenant_id: string;
  group_code: string;
  group_name: string;
  description: string | null;
  group_type: string;
  sort_order: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: number;
}

export interface GroupMember {
  user_id: string;
  username: string;
  real_name: string | null;
  joined_at: Date;
}

export interface GroupRole {
  role_id: string;
  role_code: string;
  role_name: string;
}

export interface GroupDetail extends UserGroupEntity {
  members: GroupMember[];
  roles: GroupRole[];
  memberCount: number;
  roleCount: number;
}

export interface UserGroupListQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  groupType?: string;
  status?: string;
}
