export interface LoginInput {
  tenantCode: string;
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
  deviceId?: string;
  clientIp: string;
  userAgent: string;
}

export interface TokenPayload {
  userId: string;
  tenantId: string;
  username: string;
  roles?: string[];
  deviceId?: string;
}

export interface AuthUser {
  userId: string;
  username: string;
  tenantId: string;
  tenantCode?: string;
  roles: string[];
}
