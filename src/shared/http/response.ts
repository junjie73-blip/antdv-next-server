import { Response } from "express";
import { ApiResponse, PageResponse } from "@/shared/types/api-response.js";
import dayjs from "dayjs";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";
import { getDataScope } from "@/core/index.js";
import { fieldMaskService } from "@/modules/field-mask/service/field-mask.service.js";
/**
 * 尝试自动脱敏
 * - 优先从请求上下文读取 userId/tenantId
 * - 需要调用方明确传入 resource（通过 res.locals.maskResource 设置）
 */
async function tryMask(data: unknown, res: Response): Promise<unknown> {
  const resource = (res.locals as any).maskResource as string | undefined;
  if (!resource || !data) return data;

  try {
    const ctx = getDataScope();
    const userRoles = ctx.roles ?? [];
    return await fieldMaskService.applyTo(
      data,
      resource,
      ctx.tenantId,
      userRoles,
    );
  } catch {
    return data; // 脱敏失败兜底放行（不阻断响应）
  }
}
export async function success<T = any>(
  res: Response,
  data: T,
  message = "操作成功",
  code = 200,
): Promise<void> {
  const _data = (await tryMask(data as any, res)) as any;
  if (_data && _data.list) {
    _data.list = _data.list.map(keysToCamelCase).map((item: any) => {
      for (const key in item) {
        if (item[key] instanceof Date) {
          item[key] = dayjs(item[key]).format("YYYY-MM-DD HH:mm:ss");
        }
      }
      return item;
    });
  }
  const response: ApiResponse<T> = {
    code,
    message,
    data: _data,
    timestamp: new Date().getTime(),
  };
  res.status(code >= 200 && code < 300 ? code : 200).json(response);
}

export function error(
  res: Response,
  message = "操作失败",
  code = 500,
  statusCode = 500,
): void {
  const response: ApiResponse<null> = {
    code,
    message,
    data: null,
    timestamp: new Date().getTime(),
  };
  res.status(statusCode).json(response);
}

export async function pageSuccess<T>(
  res: Response,
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
  message = "查询成功",
): Promise<void> {
  const totalPages = Math.ceil(total / pageSize);
  const masked = (await tryMask(list as any, res)) as T[];
  const response: ApiResponse<PageResponse<T>> = {
    code: 200,
    message,
    data: {
      list: masked.map(keysToCamelCase).map((item: any) => {
        for (const key in item) {
          if (item[key] instanceof Date) {
            item[key] = dayjs(item[key]).format("YYYY-MM-DD HH:mm:ss");
          }
        }
        return item;
      }),
      total,
      pageNum,
      pageSize,
      totalPages,
    },
    timestamp: new Date().getTime(),
  };
  res.status(200).json(response);
}
