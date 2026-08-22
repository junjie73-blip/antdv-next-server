export function success<T>(data: T, message = "请求成功", code = 200) {
  return { success: true, message, data, code };
}

export function error<T>(data: T, message = "请求失败", code = 500) {
  return { success: false, message, data, code };
}
