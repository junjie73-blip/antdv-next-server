import { Response } from "express";
import { ApiResponse, PageResponse } from "@/shared/types/api-response.js";
import dayjs from "dayjs";
import { keysToCamelCase } from "@/shared/utils/case-convert.js";

export function success<T = any>(
  res: Response,
  data: T,
  message = "操作成功",
  code = 200,
): void {
  const _data = data as any;
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

export function pageSuccess<T>(
  res: Response,
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
  message = "查询成功",
): void {
  const totalPages = Math.ceil(total / pageSize);
  const response: ApiResponse<PageResponse<T>> = {
    code: 200,
    message,
    data: {
      list: list.map(keysToCamelCase).map((item: any) => {
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
