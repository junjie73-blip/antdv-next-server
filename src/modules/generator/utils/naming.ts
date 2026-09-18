/** user_name -> userName */
export function toCamelCase(name: string): string {
  return name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** user_name -> UserName */
export function toPascalCase(name: string): string {
  if (!name) return name;
  const camel = toCamelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** sys_user -> User（去 sys_ 前缀） */
export function toClassName(tableName: string, prefix = "sys_"): string {
  const name =
    prefix && tableName.startsWith(prefix)
      ? tableName.slice(prefix.length)
      : tableName;
  return toPascalCase(name);
}

export function lowerFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/** 从表名推断业务名：sys_user -> user */
export function toBusinessName(tableName: string, prefix = "sys_"): string {
  return lowerFirst(toClassName(tableName, prefix));
}
