/** 数据范围 */
export const DATA_SCOPE = {
    ALL: "1", // 全部数据
    CUSTOM: "2", // 自定义部门
    DEPT: "3", // 本部门
    DEPT_AND_CHILD: "4", // 本部门及以下
    SELF: "5", // 仅本人
};
export const DATA_SCOPE_LABEL = {
    [DATA_SCOPE.ALL]: "全部数据",
    [DATA_SCOPE.CUSTOM]: "自定义部门",
    [DATA_SCOPE.DEPT]: "本部门",
    [DATA_SCOPE.DEPT_AND_CHILD]: "本部门及以下",
    [DATA_SCOPE.SELF]: "仅本人",
};
/** 内置角色编码 */
export const BUILTIN_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    TENANT_ADMIN: "tenant_admin",
};
//# sourceMappingURL=role.js.map