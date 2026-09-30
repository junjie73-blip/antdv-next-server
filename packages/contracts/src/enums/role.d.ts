/** 数据范围 */
export declare const DATA_SCOPE: {
    readonly ALL: "1";
    readonly CUSTOM: "2";
    readonly DEPT: "3";
    readonly DEPT_AND_CHILD: "4";
    readonly SELF: "5";
};
export type DataScope = (typeof DATA_SCOPE)[keyof typeof DATA_SCOPE];
export declare const DATA_SCOPE_LABEL: Record<DataScope, string>;
/** 内置角色编码 */
export declare const BUILTIN_ROLE: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly TENANT_ADMIN: "tenant_admin";
};
export type BuiltinRoleCode = (typeof BUILTIN_ROLE)[keyof typeof BUILTIN_ROLE];
//# sourceMappingURL=role.d.ts.map