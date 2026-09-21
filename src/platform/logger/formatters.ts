import { getTraceId } from "@/core/context/trace.js";

export const baseFormatter = {
  level: (label: string) => ({ level: label.toUpperCase() }),
  bindings: () => ({ traceId: getTraceId() }),
};

export const redactPaths = [
  "password",
  "oldPassword",
  "newPassword",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "req.headers.authorization",
  "req.headers.cookie",
  "err.config.headers.authorization",
  "*.phone",
  "*.idCard",
  "*.id_card",
  "*.email",
  "*.captchaCode",
];
