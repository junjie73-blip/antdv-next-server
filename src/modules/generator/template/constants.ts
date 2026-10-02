export const TEMPLATE_CATEGORY = {
  BACKEND: "backend",
  FRONTEND: "frontend",
  SQL: "sql",
} as const;
export type TemplateCategory =
  (typeof TEMPLATE_CATEGORY)[keyof typeof TEMPLATE_CATEGORY];
export const TEMPLATE_CATEGORIES = Object.values(TEMPLATE_CATEGORY);

/** 缓存 TTL */
export const TEMPLATE_CACHE_TTL = 600;

/** 模板内容最大长度 */
export const MAX_TEMPLATE_SIZE = 200_000;
