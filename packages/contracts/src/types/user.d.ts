export interface UsersProfile {
    userId: string;
    tenantId: string;
    username: string;
    realName: string | null;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    gender: number;
    status: string;
    deptId: string | null;
    deptName: string | null;
    roles: Array<{
        roleId: string;
        roleName: string;
        roleCode: string;
    }>;
}
export interface UsersOption {
    userId: string;
    username: string;
    realName: string | null;
    label: string;
    value: string;
}
//# sourceMappingURL=user.d.ts.map