import { BaseService } from "@/core/base/service.js";
import { AuditLogRepository } from "./repository.js";
import { generateExcel, type ExcelColumn } from "@/core/excel/excel.service.js";
import dayjs from "dayjs";

const EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "日志ID", key: "log_id", width: 36 },
  { header: "租户ID", key: "tenant_id", width: 36 },
  { header: "用户ID", key: "user_id", width: 36 },
  { header: "用户名", key: "username", width: 16 },
  { header: "操作", key: "operation", width: 30 },
  { header: "方法", key: "method", width: 10 },
  { header: "请求URL", key: "request_url", width: 40 },
  { header: "请求参数", key: "request_params", width: 40 },
  { header: "响应数据", key: "response_data", width: 40 },
  { header: "IP地址", key: "ip_address", width: 20 },
  { header: "用户代理", key: "user_agent", width: 30 },
  { header: "执行时间(ms)", key: "execute_time", width: 14 },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "成功" : "失败"),
  },
  { header: "错误信息", key: "error_msg", width: 30 },
  {
    header: "创建时间",
    key: "created_at",
    width: 20,
    formatter: (v: any) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : ""),
  },
];

export class AuditLogService extends BaseService<AuditLogRepository> {
  constructor(repository: AuditLogRepository) {
    super(repository);
  }

  async exportToExcel(where: any): Promise<Buffer> {
    const logs = await this.repository.findAll(where);
    return generateExcel(logs, EXPORT_COLUMNS, "审计日志");
  }

  async findDetail(id: string, tenantId: string) {
    return this.repository.findDetailById(id, tenantId);
  }
}
