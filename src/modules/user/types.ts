export interface UserListItem {
  userId: string;
  username: string;
  realName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tenantId: string;
}

export interface RegisterTenantInput {
  tenantCode: string;
  tenantName: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
}
