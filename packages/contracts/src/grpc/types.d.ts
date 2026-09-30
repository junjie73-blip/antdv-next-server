export interface Empty {
}
export interface Pagination {
    pageNum: number;
    pageSize: number;
}
export interface PageInfo {
    total: number;
    pageNum: number;
    pageSize: number;
    totalPages: number;
}
export interface Meta {
    traceId?: string;
    requestId?: string;
}
export interface VerifyTokenRequest {
    token: string;
}
export interface VerifyTokenResponse {
    valid: boolean;
    userId: string;
    tenantId: string;
    username: string;
    deviceId: string;
    roles: string[];
    reason: string;
}
export interface GetPermissionsRequest {
    userId: string;
    tenantId: string;
}
export interface GetPermissionsResponse {
    permissions: string[];
}
export interface CheckPermissionRequest {
    userId: string;
    tenantId: string;
    permission: string;
}
export interface CheckPermissionResponse {
    allowed: boolean;
    reason: string;
}
export interface KickUserRequest {
    userId: string;
    tenantId: string;
    reason?: string;
    operatorId?: string;
}
export interface GetUserRequest {
    userId: string;
    tenantId: string;
}
export interface BatchGetUsersRequest {
    userIds: string[];
    tenantId: string;
}
export interface UserProfile {
    userId: string;
    tenantId: string;
    username: string;
    realName: string;
    email: string;
    phone: string;
    avatar: string;
    gender: number;
    status: string;
    deptId: string;
    deptName: string;
}
export interface BatchGetUsersResponse {
    users: UserProfile[];
}
export interface GetUserOptionsRequest {
    tenantId: string;
}
export interface UserOption {
    userId: string;
    username: string;
    realName: string;
    label: string;
}
export interface GetUserOptionsResponse {
    options: UserOption[];
}
export interface SendNoticeRequest {
    tenantId: string;
    title: string;
    content: string;
    channels: string[];
    receivers: Record<string, string>;
    templateId: string;
}
export interface ChannelResult {
    channel: string;
    total: number;
    success: number;
    failed: number;
    errors: string[];
}
export interface SendNoticeResponse {
    success: boolean;
    results: ChannelResult[];
}
export interface PublishNoticeRequest {
    noticeId: string;
    tenantId: string;
}
export interface IAuthClient {
    verifyToken(req: VerifyTokenRequest): Promise<VerifyTokenResponse>;
    getUserPermissions(req: GetPermissionsRequest): Promise<GetPermissionsResponse>;
    checkPermission(req: CheckPermissionRequest): Promise<CheckPermissionResponse>;
    kickUser(req: KickUserRequest): Promise<Empty>;
}
//# sourceMappingURL=types.d.ts.map