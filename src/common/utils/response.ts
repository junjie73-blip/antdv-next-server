export function success<T>(data: T, message = "请求成功", code = 200) {
  return { success: true, message, data, code, timestamp: Date.now() };
}

export function error<T>(data: T, message = "请求失败", code = 500) {
  return {
    success: false,
    message,
    data,
    code,
    timestamp: Date.now(),
  };
}

export function pageSuccess<T>(
  list: T[],
  total: number,
  pageNum: number,
  pageSize: number,
  message = "查询成功",
) {
  const totalPages = Math.ceil(total / pageSize);
  return success(
    {
      list,
      total,
      pageNum,
      pageSize,
      totalPages,
    },
    message,
  );
}
