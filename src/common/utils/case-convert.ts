/**
 * 命名转换工具
 * 数据库下划线命名 <=> API 小驼峰命名
 */

/**
 * 将对象键从下划线命名转换为小驼峰命名
 * 用于 API 响应数据转换
 */
export function keysToCamelCase<T>(obj: unknown): T {
  if (obj === null || typeof obj !== "object") {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamelCase(item)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    result[camelKey] = keysToCamelCase(value);
  }
  return result as T;
}

/**
 * 将对象键从小驼峰命名转换为下划线命名
 * 用于接收前端请求参数转换
 */
export function keysToSnakeCase<T>(obj: unknown): T {
  if (obj === null || typeof obj !== "object") {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnakeCase(item)) as T;
  }

  if (obj instanceof Date) {
    return obj as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`,
    );
    result[snakeKey] = keysToSnakeCase(value);
  }
  return result as T;
}
