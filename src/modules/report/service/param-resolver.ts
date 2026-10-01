import { AppError } from "@/core/errors.js";
import { logger } from "@/platform/logger/index.js";
import { ExpressionEvaluator } from "@/modules/workflow/service/expression-evaluator.js";
import type { ParamDef, ParamType } from "../types.js";

/** 解析上下文（提供动态变量） */
export interface ParamResolveContext {
  currentUser: {
    userId: string;
    username: string;
    tenantId: string;
    deptId?: string | null;
    roles?: string[];
  };
  now?: Date;
  today?: string;
  /** 其他自定义上下文 */
  [key: string]: any;
}

export class ParamResolver {
  /**
   * 解析参数
   * @param defs 参数定义
   * @param input 用户输入
   * @param context 上下文
   */
  static resolve(
    defs: ParamDef[],
    input: Record<string, any>,
    context: ParamResolveContext,
  ): Record<string, any> {
    if (!defs || defs.length === 0) return {};

    const result: Record<string, any> = {};
    const errors: string[] = [];

    for (const def of defs) {
      try {
        const value = this.resolveOne(def, input, context);
        if (value !== undefined) {
          result[def.name] = value;
        }
      } catch (err: any) {
        errors.push(`${def.name}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      throw new AppError(`参数校验失败：${errors.join("; ")}`, 400001, 400);
    }

    return result;
  }

  /**
   * 解析单个参数
   */
  private static resolveOne(
    def: ParamDef,
    input: Record<string, any>,
    context: ParamResolveContext,
  ): any {
    let value: any;

    // 1. 优先使用输入值
    const inputValue = input[def.name];
    if (inputValue !== undefined && inputValue !== null && inputValue !== "") {
      value = inputValue;
    }

    // 2. 表达式求值
    if (value === undefined && def.expression) {
      try {
        value = this.evaluateExpression(def.expression, context);
      } catch (err: any) {
        logger.warn(
          { err: err.message, expression: def.expression, param: def.name },
          "[param-resolver] 表达式求值失败",
        );
      }
    }

    // 3. 默认值
    if (value === undefined || value === null || value === "") {
      value = def.defaultValue;
    }

    // 4. 必填校验
    if (
      def.required &&
      (value === undefined || value === null || value === "")
    ) {
      throw new AppError(`缺少必填参数`, 400001, 400);
    }

    // 5. 空值直接返回
    if (value === undefined || value === null) {
      return value;
    }

    // 6. 类型转换 + 校验
    return this.coerceAndValidate(value, def);
  }

  /**
   * 表达式求值
   * 支持：$currentUser.deptId、$today、$now 等
   */
  private static evaluateExpression(
    expression: string,
    context: ParamResolveContext,
  ): any {
    // 标准化：$ 前缀转成 context 变量
    const normalized = expression.replace(
      /\$([a-zA-Z_][a-zA-Z0-9_.]*)/g,
      (_match, path) => {
        // 提取根变量
        const rootName = path.split(".")[0];
        // 检查上下文是否有该变量
        if (rootName in context) {
          return path;
        }
        return `undefined`;
      },
    );

    // 构造求值上下文
    const evalContext: Record<string, any> = {
      now: context.now ?? new Date(),
      today: context.today ?? new Date().toISOString().slice(0, 10),
      ...context,
      currentUser: context.currentUser,
    };

    return ExpressionEvaluator.evaluate(normalized, evalContext);
  }

  /**
   * 类型转换 + 校验
   */
  private static coerceAndValidate(value: any, def: ParamDef): any {
    let converted = value;

    // 类型转换
    switch (def.type) {
      case "number": {
        const n = Number(value);
        if (isNaN(n)) {
          throw new AppError(`必须是数字`, 400001, 400);
        }
        converted = n;
        break;
      }

      case "boolean": {
        if (typeof value === "boolean") {
          converted = value;
        } else if (value === "true" || value === "1" || value === 1) {
          converted = true;
        } else if (value === "false" || value === "0" || value === 0) {
          converted = false;
        } else {
          throw new AppError(`必须是布尔值`, 400001, 400);
        }
        break;
      }

      case "date": {
        const d = this.parseDate(value, false);
        converted = d.toISOString().slice(0, 10);
        break;
      }

      case "datetime": {
        const d = this.parseDate(value, true);
        converted = d.toISOString();
        break;
      }

      case "array": {
        if (Array.isArray(value)) {
          converted = value;
        } else if (typeof value === "string") {
          converted = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else {
          converted = [value];
        }
        break;
      }

      case "enum": {
        const options = def.options ?? [];
        const matched = options.find((o) => o.value === value);
        if (!matched) {
          throw new AppError(
            `值不在允许范围内（${options.map((o) => o.value).join(", ")}）`,
            400001,
            400,
          );
        }
        converted = matched.value;
        break;
      }

      case "string":
      default:
        converted = String(value);
        break;
    }

    // 校验
    this.validateParam(converted, def);

    return converted;
  }

  /**
   * 参数校验
   */
  private static validateParam(value: any, def: ParamDef): void {
    // number 范围
    if (def.type === "number") {
      if (def.min !== undefined && value < def.min) {
        throw new AppError(`不能小于 ${def.min}`, 400001, 400);
      }
      if (def.max !== undefined && value > def.max) {
        throw new AppError(`不能大于 ${def.max}`, 400001, 400);
      }
    }

    // string 正则
    if (def.type === "string" && def.pattern) {
      const regex = new RegExp(def.pattern);
      if (!regex.test(value)) {
        throw new AppError(`格式不符合要求`, 400001, 400);
      }
    }

    // string 长度
    if (def.type === "string") {
      if (def.min !== undefined && value.length < def.min) {
        throw new AppError(`长度不能少于 ${def.min}`, 400001, 400);
      }
      if (def.max !== undefined && value.length > def.max) {
        throw new AppError(`长度不能超过 ${def.max}`, 400001, 400);
      }
    }

    // array 长度
    if (def.type === "array") {
      if (def.min !== undefined && value.length < def.min) {
        throw new AppError(`元素个数不能少于 ${def.min}`, 400001, 400);
      }
      if (def.max !== undefined && value.length > def.max) {
        throw new AppError(`元素个数不能超过 ${def.max}`, 400001, 400);
      }
    }
  }

  /**
   * 日期解析（兼容多种格式）
   */
  private static parseDate(value: any, withTime: boolean): Date {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new AppError(`日期无效`, 400001, 400);
      }
      return value;
    }

    if (typeof value === "number") {
      const d = new Date(value);
      if (isNaN(d.getTime())) {
        throw new AppError(`日期无效`, 400001, 400);
      }
      return d;
    }

    if (typeof value === "string") {
      // 支持：YYYY-MM-DD、YYYY/MM/DD、ISO 8601
      const normalized = value.replace(/\//g, "-");
      const d = new Date(normalized);
      if (isNaN(d.getTime())) {
        throw new AppError(`日期格式错误`, 400001, 400);
      }
      return d;
    }

    throw new AppError(`日期格式错误`, 400001, 400);
  }

  /**
   * 从 SQL 中提取 :param 变量名
   */
  static extractFromSql(sql: string): string[] {
    const names = new Set<string>();
    const regex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sql)) !== null) {
      names.add(m[1]);
    }
    return [...names];
  }

  /**
   * 自动补全参数定义（从 SQL 提取，但未定义的参数）
   */
  static autoFillDefs(defs: ParamDef[], sql: string): ParamDef[] {
    const existing = new Set(defs.map((d) => d.name));
    const sqlParams = this.extractFromSql(sql);

    const missing = sqlParams.filter((name) => !existing.has(name));
    if (missing.length === 0) return defs;

    // 自动生成默认定义（全部当成可选 string）
    const autoDefs: ParamDef[] = missing.map((name) => ({
      name,
      type: "string",
      required: false,
    }));

    return [...defs, ...autoDefs];
  }
}
