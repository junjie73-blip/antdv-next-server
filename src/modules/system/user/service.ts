import { UserRepository } from "./repository.js";
import { hash } from "bcryptjs";
import * as XLSX from "xlsx";
import { BaseService } from "@/core/base/service.js";
import dayjs from "dayjs";
import { ExcelColumn, generateExcel } from "@/platform/excel/index.js";
import {
  AUDIT_OP,
  AUDIT_OP_LABEL,
} from "@/shared/constants/audit-operation.js";
import { getClientIp } from "@/shared/utils/ip.js";
import { pushBusinessAudit } from "@/middleware/business/audit.js";
import { AppError, decryptField, NotFoundError } from "@/core/index.js";
import { logger } from "@/platform/logger/logger.js";
import type { Request } from "express";
import { recordOrgHistory } from "@/modules/org-history/recorder.js";
import { maybeTriggerSnapshot } from "@/modules/org-history/snapshot-trigger.js";
const EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "用户名", key: "username", width: 16 },
  { header: "真实姓名", key: "real_name", width: 16 },
  { header: "邮箱", key: "email", width: 30 },
  { header: "手机号", key: "phone", width: 16 },
  { header: "部门", key: "deptName", width: 40 },
  { header: "角色", key: "roleNames", width: 40 },
  {
    header: "性别",
    key: "gender",
    width: 16,
    formatter: (v: number) => (v === 0 ? "未知" : v === 1 ? "男" : "女"),
  },
  {
    header: "状态",
    key: "status",
    width: 8,
    formatter: (v: string) => (v === "1" ? "启用" : "禁用"),
  },
  { header: "创建时间", key: "createdAt", width: 40 },
];

export class UserService extends BaseService<UserRepository> {
  constructor(repository: UserRepository) {
    super(repository);
  }

  async resetPassword(userId: string, newPassword: string, tenantId: string) {
    await this.assertExists(userId, tenantId, "用户");
    const hashed = await hash(newPassword, 10);
    await this.repository.updatePassword(userId, hashed);
    this.log("resetPassword", { userId });
  }

  async updateRoles(userId: string, roleIds: string[], tenantId: string) {
    await this.assertExists(userId, tenantId, "用户");
    await this.repository.updateUserRoles(userId, roleIds, tenantId);
  }

  async updateDepts(userId: string, deptIds: string[], tenantId: string) {
    await this.assertExists(userId, tenantId, "用户");
    const result = await this.repository.updateUserDepts(
      userId,
      deptIds,
      tenantId,
    );
    await maybeTriggerSnapshot(tenantId, result.total, {
      trigger: "app",
      reason: "user_dept_update",
    });
  }

  async exportToExcel(where: any, tenantId: string): Promise<Buffer> {
    const users = await this.repository.findAllForExport(where, tenantId);
    const rows = users.map((u: any) => ({
      ...u,
      deptName: u.sys_user_dept?.[0]?.dept?.dept_name || "",
      roleNames:
        u.sys_user_role
          ?.map((ur: any) => ur.role?.role_name)
          .filter(Boolean)
          .join(",") || "",
      createdAt: dayjs(u.created_at).format("YYYY-MM-DD HH:mm:ss"),
    }));
    return generateExcel(rows, EXPORT_COLUMNS, "用户数据");
  }

  async importFromExcel(buffer: Buffer, tenantId: string, userId?: string) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        const username = String(row["用户名"] || "").trim();
        if (!username) throw new Error("用户名必填");

        const exist = await this.repository.findUserByUsername(
          username,
          tenantId,
        );
        if (exist) throw new Error(`用户名 '${username}' 已存在`);

        // 解析角色/部门编码
        const roleIds = await this.resolveRoleCodes(
          String(row["角色编码"] || ""),
          tenantId,
        );
        const deptIds = await this.resolveDeptCodes(
          String(row["部门编码"] || ""),
          tenantId,
        );

        await this.repository.createWithRelations(
          {
            username,
            password: await hash("123456", 10),
            real_name: String(row["真实姓名"] || ""),
            phone: String(row["手机号"] || ""),
            email: String(row["邮箱"] || ""),
            gender: row["性别"] === "男" ? 1 : row["性别"] === "女" ? 2 : 0,
            status: row["状态"] === "禁用" ? "0" : "1",
            role_ids: roleIds,
            dept_ids: deptIds,
          },
          tenantId,
          userId,
        );
        successCount++;
      } catch (e: any) {
        errors.push(`第${rowNum}行：${e.message}`);
      }
    }
    await recordOrgHistory(rows, { source: "import" });
    await maybeTriggerSnapshot(tenantId, rows.length, {
      trigger: "app",
      reason: "excel_import",
    });

    return { successCount, failCount: errors.length, errors };
  }

  private async resolveRoleCodes(
    codes: string,
    tenantId: string,
  ): Promise<string[]> {
    if (!codes) return [];
    const list = codes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const roles = await this.repository.findRolesByCodes(list, tenantId);
    if (roles.length !== list.length) throw new Error("存在无效的角色编码");
    return roles.map((r: any) => r.role_id);
  }

  private async resolveDeptCodes(
    codes: string,
    tenantId: string,
  ): Promise<string[]> {
    if (!codes) return [];
    const list = codes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const depts = await this.repository.findDeptsByCodes(list, tenantId);
    if (depts.length !== list.length) throw new Error("存在无效的部门编码");
    return depts.map((d: any) => d.dept_id);
  }
  async getUserOptions(tenantId: string) {
    const users = await this.repository.findUserOptions(tenantId);
    return users.map((u: any) => ({
      userId: u.user_id,
      username: u.username,
      realName: u.real_name || u.username,
      label: u.real_name || u.username,
      value: u.user_id,
    }));
  }
  async getSensitiveInfo(
    targetUserId: string,
    tenantId: string,
    operator: { userId: string; username: string },
    req: Request,
  ) {
    const startAt = Date.now();

    // 1) 校验目标用户归属
    const user = await this.repository.findSensitiveById(
      targetUserId,
      tenantId,
    );
    if (!user) throw new NotFoundError("用户不存在");

    // 2) 解密敏感字段
    let plainPhone: string | null = null;
    try {
      if (user.phone_enc) {
        plainPhone = decryptField(user.phone_enc);
      } else if (user.phone) {
        // 兼容历史明文数据
        plainPhone = user.phone;
      }
    } catch (err) {
      logger.error(
        { err, userId: targetUserId },
        "[user] decrypt phone failed",
      );
      throw new AppError("敏感数据解密失败", 500001, 500);
    }

    let plainIdCard: string | null = null;
    if (user.id_card_enc) {
      try {
        plainIdCard = decryptField(user.id_card_enc);
      } catch (err) {
        logger.error(
          { err, userId: targetUserId },
          "[user] decrypt id_card failed",
        );
        // 身份证解密失败不阻断，返回 null
        plainIdCard = null;
      }
    }

    // 3) 审计日志
    await pushBusinessAudit(req, {
      tenantId,
      userId: operator.userId,
      username: operator.username,
      operation: AUDIT_OP.USER_VIEW_SENSITIVE,
      method: req.method,
      requestUrl: req.originalUrl,
      requestParams: { targetUserId },
      responseData: { queriedFields: ["phone", "idCard", "email"] },
      ipAddress: getClientIp(req) || "unknown",
      userAgent: req.headers["user-agent"] || "",
      executeTime: Date.now() - startAt,
      status: "1",
      metadata: { label: AUDIT_OP_LABEL[AUDIT_OP.USER_VIEW_SENSITIVE] },
    });

    return {
      userId: user.user_id,
      username: user.username,
      realName: user.real_name,
      phone: plainPhone,
      idCard: plainIdCard,
      email: user.email,
    };
  }
  async getFullDetail(userId: string, tenantId: string) {
    const [basic, roles, depts, recentLogins, recentAudits] = await Promise.all(
      [
        this.repository.findUserDetail(userId, tenantId),
        this.repository.findUserRoles(userId, tenantId),
        this.repository.findUserDepts(userId, tenantId),
        this.repository.findRecentLoginLogs(userId, tenantId, 10),
        this.repository.findRecentAuditLogs(userId, tenantId, 10),
      ],
    );

    if (!basic) throw new NotFoundError("用户不存在");

    return {
      basic,
      roles,
      depts,
      recentLogins,
      recentAudits,
    };
  }
}
