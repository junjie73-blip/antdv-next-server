export interface AuthUser {
    userId: string;
    tenantId: string;
    username: string;
    deviceId?: string;
    roles: string[];
    permissions?: string[];
}
export interface TokenPayload {
    userId: string;
    tenantId: string;
    username: string;
    deviceId: string;
    roles: string[];
    type: "access" | "refresh";
    iat?: number;
    exp?: number;
}
export interface IssueTokensInput {
    userId: string;
    tenantId: string;
    username: string;
    roles: string[];
    deviceId?: string;
}
export interface IssueTokensOutput {
    accessToken: string;
    refreshToken: string;
    deviceId: string;
}
export interface VerifyTokenOutput {
    valid: boolean;
    user?: AuthUser;
    reason?: string;
}
//# sourceMappingURL=auth.d.ts.map