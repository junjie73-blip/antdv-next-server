/**
 * 统一错误码：{HTTP}{BUSSINESS}
 * 前 3 位是 HTTP 状态，后 3 位是业务码
 */
export declare const ERROR_CODE: {
    readonly BAD_REQUEST: 400000;
    readonly VALIDATION_FAILED: 400001;
    readonly INVALID_PARAM: 400002;
    readonly RESOURCE_EXISTS: 400003;
    readonly RESOURCE_IN_USE: 400004;
    readonly UNAUTHORIZED: 401000;
    readonly TOKEN_INVALID: 401001;
    readonly TOKEN_EXPIRED: 401002;
    readonly SESSION_EXPIRED: 401003;
    readonly KICKED_OUT: 401004;
    readonly FORBIDDEN: 403000;
    readonly PERMISSION_DENIED: 403001;
    readonly NOT_FOUND: 404000;
    readonly RESOURCE_NOT_FOUND: 404001;
    readonly CONFLICT: 409000;
    readonly UNIQUE_CONFLICT: 409001;
    readonly MFA_REQUIRED: 428001;
    readonly TOO_MANY_REQUESTS: 429000;
    readonly RATE_LIMITED: 429001;
    readonly INTERNAL_ERROR: 500000;
    readonly DB_ERROR: 500001;
    readonly EXTERNAL_SERVICE_ERROR: 500002;
    readonly BAD_GATEWAY: 502001;
    readonly UPSTREAM_UNAVAILABLE: 502002;
    readonly SERVICE_UNAVAILABLE: 503001;
};
export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
/** 错误码 → HTTP 状态 */
export declare function httpStatusFromCode(code: number): number;
//# sourceMappingURL=codes.d.ts.map