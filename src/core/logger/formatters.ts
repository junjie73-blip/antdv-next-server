import pino from "pino";

export const baseFormatter = {
  level: (label: string) => ({ level: label.toUpperCase() }),
  bindings: () => ({}),
};

export const redactPaths = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "req.headers.authorization",
];
