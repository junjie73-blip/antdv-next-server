/** 通用启用/禁用状态 */
export const STATUS = {
    DISABLED: "0",
    ENABLED: "1",
};
/** 布尔→状态 */
export function boolToStatus(v) {
    return v ? STATUS.ENABLED : STATUS.DISABLED;
}
/** 状态→布尔 */
export function statusToBool(s) {
    return s === STATUS.ENABLED;
}
//# sourceMappingURL=status.js.map