import { BaseService } from "@/core/base/service.js";
import { LoginLogRepository } from "./repository.js";
import dayjs from "dayjs";
import { ExcelColumn, generateExcel } from "@/platform/excel/service.js";

const EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "日志ID", key: "log_id", width: 36 },
  { header: "租户ID", key: "tenant_id", width: 36 },
  { header: "用户ID", key: "user_id", width: 36 },
  { header: "用户名", key: "username", width: 16 },
  { header: "IP地址", key: "ip_address", width: 20 },
  { header: "用户代理", key: "user_agent", width: 30 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "成功" : "失败"),
  },
  { header: "消息", key: "message", width: 30 },
  {
    header: "创建时间",
    key: "created_at",
    width: 20,
    formatter: (v: any) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : ""),
  },
];

export class LoginLogService extends BaseService<LoginLogRepository> {
  constructor(repository: LoginLogRepository) {
    super(repository);
  }

  async exportToExcel(where: any): Promise<Buffer> {
    const logs = await this.repository.findAll(where);
    return generateExcel(logs, EXPORT_COLUMNS, "登录日志");
  }
}
