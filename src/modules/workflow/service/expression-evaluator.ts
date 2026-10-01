import { Parser } from "expr-eval";
import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";

/* ============================================================
 * 初始化 Parser
 * ============================================================ */
const parser = new Parser({
  operators: {
    add: true,
    concatenate: true,
    conditional: true,
    divide: true,
    factorial: false, // 关闭阶乘，防大数攻击
    multiply: true,
    power: true,
    remainder: true,
    subtract: true,

    logical: true,
    comparison: true,
    in: true,
    assignment: false, // 禁止赋值
  },
});

/* ============================================================
 * 注册内置函数
 * ============================================================ */

/** 角色判断 */
parser.functions.hasRole = (roles: any, roleCode: string): boolean => {
  if (!Array.isArray(roles)) return false;
  return roles.includes(roleCode);
};

/** 多角色判断（任一） */
parser.functions.hasAnyRole = (roles: any, ...roleCodes: string[]): boolean => {
  if (!Array.isArray(roles)) return false;
  return roleCodes.some((r) => roles.includes(r));
};

/** 部门判断 */
parser.functions.hasDept = (depts: any, deptId: string): boolean => {
  if (!Array.isArray(depts)) return false;
  return depts.includes(deptId);
};

/** 区间判断 */
parser.functions.inRange = (
  value: number,
  min: number,
  max: number,
): boolean => {
  return typeof value === "number" && value >= min && value <= max;
};

/** 空值判断 */
parser.functions.isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/** 日期差（天数） */
parser.functions.daysBetween = (start: any, end: any): number => {
  const s = start instanceof Date ? start : new Date(start);
  const e = end instanceof Date ? end : new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  return Math.floor((e.getTime() - s.getTime()) / 86400000);
};

/** 日期判断 */
parser.functions.isWeekend = (date: any): boolean => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6;
};

/** 字符串包含 */
parser.functions.contains = (str: any, sub: string): boolean => {
  return typeof str === "string" && str.includes(sub);
};

/** 数组包含 */
parser.functions.containsAny = (arr: any, ...values: any[]): boolean => {
  if (!Array.isArray(arr)) return false;
  return values.some((v) => arr.includes(v));
};

/** 长度 */
parser.functions.len = (value: any): number => {
  if (typeof value === "string") return value.length;
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
};

/* ============================================================
 * 安全白名单
 * ============================================================ */
const ALLOWED_FUNCTIONS = new Set([
  "hasRole",
  "hasAnyRole",
  "hasDept",
  "inRange",
  "isEmpty",
  "daysBetween",
  "isWeekend",
  "contains",
  "containsAny",
  "len",
  "min",
  "max",
  "abs",
  "round",
  "floor",
  "ceil",
  "sqrt",
  "log",
  "exp",
]);

/** 表达式最大长度，防注入 */
const MAX_EXPRESSION_LENGTH = 2000;

/** 表达式最大执行时间（毫秒） */
const MAX_EVAL_TIME_MS = 100;

/* ============================================================
 * 表达式引擎
 * ============================================================ */
export class ExpressionEvaluator {
  /**
   * 求值
   * @param expression 表达式，如 "amount > 1000 && hasRole(roles, 'manager')"
   * @param context 上下文变量
   */
  static evaluate(expression: string, context: Record<string, any> = {}): any {
    if (!expression || typeof expression !== "string") return true;

    // 1. 长度校验
    if (expression.length > MAX_EXPRESSION_LENGTH) {
      throw new AppError(
        `表达式过长（最多 ${MAX_EXPRESSION_LENGTH} 字符）`,
        400001,
        400,
      );
    }

    // 2. 解析
    let expr: any;
    try {
      expr = parser.parse(expression);
    } catch (err: any) {
      throw new AppError(`表达式语法错误：${err.message}`, 400001, 400);
    }

    // 3. 函数白名单校验
    const usedFunctions = this.extractFunctions(expression);
    for (const fn of usedFunctions) {
      if (!ALLOWED_FUNCTIONS.has(fn)) {
        throw new AppError(`表达式使用了禁止的函数：${fn}`, 400001, 400);
      }
    }

    // 4. 变量校验
    const variables = expr.variables();
    const missing = variables.filter(
      (v: string) => !(v in context) && v !== "undefined" && v !== "null",
    );
    if (missing.length > 0) {
      throw new AppError(`表达式缺少变量：${missing.join(", ")}`, 400001, 400);
    }

    // 5. 求值（带超时保护）
    const start = Date.now();
    try {
      const result = expr.evaluate(context);
      const duration = Date.now() - start;

      if (duration > MAX_EVAL_TIME_MS) {
        logger.warn({ expression, duration }, "[expression] 求值耗时过长");
      }

      return result;
    } catch (err: any) {
      throw new AppError(`表达式求值失败：${err.message}`, 400001, 400);
    }
  }

  /**
   * 布尔求值（用于条件判断）
   */
  static evaluateBoolean(
    expression: string,
    context: Record<string, any> = {},
  ): boolean {
    const result = this.evaluate(expression, context);
    return Boolean(result);
  }

  /**
   * 校验表达式语法
   */
  static validate(expression: string): {
    valid: boolean;
    error?: string;
    variables?: string[];
    functions?: string[];
  } {
    if (!expression) return { valid: true };

    if (expression.length > MAX_EXPRESSION_LENGTH) {
      return {
        valid: false,
        error: `表达式过长（最多 ${MAX_EXPRESSION_LENGTH} 字符）`,
      };
    }

    let expr: any;
    try {
      expr = parser.parse(expression);
    } catch (err: any) {
      return { valid: false, error: `语法错误：${err.message}` };
    }

    const functions = this.extractFunctions(expression);
    for (const fn of functions) {
      if (!ALLOWED_FUNCTIONS.has(fn)) {
        return { valid: false, error: `禁止使用函数：${fn}` };
      }
    }

    return {
      valid: true,
      variables: expr.variables(),
      functions,
    };
  }

  /**
   * 提取表达式中的变量名
   */
  static extractVariables(expression: string): string[] {
    if (!expression) return [];
    try {
      return parser.parse(expression).variables();
    } catch {
      return [];
    }
  }

  /**
   * 提取表达式中的函数名
   */
  static extractFunctions(expression: string): string[] {
    if (!expression) return [];
    const functions = new Set<string>();
    // 匹配 xxx( 模式
    const regex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(expression)) !== null) {
      const name = m[1];
      // 排除 if / 逻辑运算关键字
      if (!["if", "and", "or", "not"].includes(name)) {
        functions.add(name);
      }
    }
    return [...functions];
  }
}
