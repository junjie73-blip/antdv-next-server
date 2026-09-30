/** 通用启用/禁用状态 */
export declare const STATUS: {
    readonly DISABLED: "0";
    readonly ENABLED: "1";
};
export type Status = (typeof STATUS)[keyof typeof STATUS];
/** 布尔→状态 */
export declare function boolToStatus(v: boolean): Status;
/** 状态→布尔 */
export declare function statusToBool(s: string): boolean;
//# sourceMappingURL=status.d.ts.map