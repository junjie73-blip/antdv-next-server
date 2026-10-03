import { prisma } from "@/config/database.js";
import { logger } from "@/platform/logger/index.js";

interface SeedInput {
  tenantId: string;
  createdBy?: string;
}

/**
 * 为租户初始化合规报表模板（幂等）。
 */
export async function seedComplianceReports(input: SeedInput): Promise<void> {
  const { tenantId, createdBy } = input;

  /* ============================================================
   * 1) 数据集：用户操作审计
   * ============================================================ */
  const auditDataset = await upsertDataset({
    tenantId,
    datasetCode: "compliance_audit_ops",
    datasetName: "合规-用户操作审计",
    description: "等保要求：记录关键操作",
    sql: `
      SELECT
        operation AS "操作",
        username AS "操作用户",
        method AS "方法",
        request_url AS "请求地址",
        ip_address AS "IP",
        execute_time AS "耗时(ms)",
        CASE status WHEN '1' THEN '成功' ELSE '失败' END AS "状态",
        error_msg AS "错误信息",
        created_at AS "操作时间"
      FROM sys_audit_log
      WHERE tenant_id = :tenantId::uuid
        AND created_at >= :startTime::timestamptz
        AND created_at < :endTime::timestamptz
        AND (:username::text IS NULL OR username = :username::text)
        AND (:operation::text IS NULL OR operation LIKE '%' || :operation::text || '%')
      ORDER BY created_at DESC
    `,
    params: [
      {
        name: "startTime",
        label: "开始时间",
        type: "datetime",
        required: true,
        expression: "$now.startOfMonth",
      },
      {
        name: "endTime",
        label: "结束时间",
        type: "datetime",
        required: true,
        expression: "$now.endOfMonth",
      },
      { name: "username", label: "操作用户", type: "string", required: false },
      { name: "operation", label: "操作类型", type: "string", required: false },
    ],
    createdBy,
  });

  /* ============================================================
   * 2) 数据集：登录审计
   * ============================================================ */
  const loginDataset = await upsertDataset({
    tenantId,
    datasetCode: "compliance_login",
    datasetName: "合规-登录审计",
    description: "等保要求：登录成功/失败记录",
    sql: `
      SELECT
        username AS "用户名",
        ip_address AS "IP",
        user_agent AS "客户端",
        CASE status WHEN '1' THEN '成功' ELSE '失败' END AS "状态",
        message AS "消息",
        created_at AS "登录时间"
      FROM sys_login_log
      WHERE tenant_id = :tenantId::uuid
        AND created_at >= :startTime::timestamptz
        AND created_at < :endTime::timestamptz
        AND (:username::text IS NULL OR username = :username::text)
      ORDER BY created_at DESC
    `,
    params: [
      {
        name: "startTime",
        label: "开始时间",
        type: "datetime",
        required: true,
        expression: "$now.startOfMonth",
      },
      {
        name: "endTime",
        label: "结束时间",
        type: "datetime",
        required: true,
        expression: "$now.endOfMonth",
      },
      { name: "username", label: "用户名", type: "string", required: false },
    ],
    createdBy,
  });

  /* ============================================================
   * 3) 数据集：组织变更审计
   * ============================================================ */
  const orgDataset = await upsertDataset({
    tenantId,
    datasetCode: "compliance_org_changes",
    datasetName: "合规-组织变更审计",
    description: "等保要求：人员调动 / 权限变更",
    sql: `
      SELECT
        CASE scope
          WHEN 'dept_tree' THEN '部门调整'
          WHEN 'user_dept' THEN '人员调动'
          WHEN 'user_role' THEN '权限变更'
          WHEN 'user_profile' THEN '个人信息'
          ELSE '其他'
        END AS "变更类型",
        summary AS "变更摘要",
        operator_name AS "操作者",
        ip_address AS "IP",
        source AS "来源",
        CASE WHEN reverted_at IS NOT NULL THEN '是' ELSE '否' END AS "已撤销",
        created_at AS "变更时间"
      FROM sys_org_history
      WHERE tenant_id = :tenantId::uuid
        AND created_at >= :startTime::timestamptz
        AND created_at < :endTime::timestamptz
        AND (:scope::text IS NULL OR scope = :scope::text)
      ORDER BY created_at DESC
    `,
    params: [
      {
        name: "startTime",
        label: "开始时间",
        type: "datetime",
        required: true,
        expression: "$now.startOfMonth",
      },
      {
        name: "endTime",
        label: "结束时间",
        type: "datetime",
        required: true,
        expression: "$now.endOfMonth",
      },
      {
        name: "scope",
        label: "变更类型",
        type: "enum",
        required: false,
        options: [
          { label: "全部", value: "" },
          { label: "部门调整", value: "dept_tree" },
          { label: "人员调动", value: "user_dept" },
          { label: "权限变更", value: "user_role" },
          { label: "个人信息", value: "user_profile" },
        ],
      },
    ],
    createdBy,
  });

  /* ============================================================
   * 4) 数据集：权限审计（含当前权限快照）
   * ============================================================ */
  const permDataset = await upsertDataset({
    tenantId,
    datasetCode: "compliance_permissions",
    datasetName: "合规-权限分配审计",
    description: "等保要求：用户-角色-权限映射",
    sql: `
      SELECT
        u.username AS "用户名",
        u.real_name AS "姓名",
        r.role_name AS "角色",
        r.role_code AS "角色编码",
        r.data_scope AS "数据范围",
        string_agg(p.perm_name, ', ') AS "权限点",
        u.status AS "用户状态"
      FROM sys_user u
      JOIN sys_user_role ur ON ur.user_id = u.user_id
      JOIN sys_role r ON r.role_id = ur.role_id
      LEFT JOIN sys_role_permission rp ON rp.role_id = r.role_id
      LEFT JOIN sys_permission p ON p.perm_id = rp.perm_id AND p.status = '1'
      WHERE u.tenant_id = :tenantId::uuid
        AND u.is_deleted = 0
        AND r.is_deleted = 0
      GROUP BY u.username, u.real_name, r.role_name, r.role_code, r.data_scope, u.status
      ORDER BY u.username, r.role_name
    `,
    params: [],
    createdBy,
  });

  /* ============================================================
   * 5) 报表：用户操作审计月报
   * ============================================================ */
  await upsertReport({
    tenantId,
    reportCode: "compliance_audit_ops_monthly",
    reportName: "用户操作审计月报",
    description: "等保要求：每月操作审计",
    datasetId: auditDataset.dataset_id,
    config: {
      columns: [
        { key: "操作时间", label: "操作时间", type: "date", width: 160 },
        { key: "操作用户", label: "操作用户" },
        { key: "操作", label: "操作" },
        { key: "方法", label: "方法", width: 80 },
        { key: "请求地址", label: "请求地址", width: 260 },
        { key: "IP", label: "IP" },
        { key: "耗时(ms)", label: "耗时(ms)", type: "number", width: 100 },
        { key: "状态", label: "状态", width: 80 },
        { key: "错误信息", label: "错误信息", width: 200 },
      ],
      style: { zebra: true, border: true },
    },
    params: [], // 用数据集 params
    createdBy,
  });

  /* ============================================================
   * 6) 报表：登录审计月报
   * ============================================================ */
  await upsertReport({
    tenantId,
    reportCode: "compliance_login_monthly",
    reportName: "登录审计月报",
    description: "等保要求：每月登录审计",
    datasetId: loginDataset.dataset_id,
    config: {
      columns: [
        { key: "登录时间", label: "登录时间", type: "date", width: 160 },
        { key: "用户名", label: "用户名" },
        { key: "IP", label: "IP" },
        { key: "客户端", label: "客户端", width: 260 },
        { key: "状态", label: "状态", width: 80 },
        { key: "消息", label: "消息", width: 200 },
      ],
      style: { zebra: true, border: true },
    },
    createdBy,
  });

  /* ============================================================
   * 7) 报表：组织变更月报
   * ============================================================ */
  await upsertReport({
    tenantId,
    reportCode: "compliance_org_monthly",
    reportName: "组织变更月报",
    description: "等保要求：每月人员/权限变更审计",
    datasetId: orgDataset.dataset_id,
    config: {
      columns: [
        { key: "变更时间", label: "变更时间", type: "date", width: 160 },
        { key: "变更类型", label: "变更类型" },
        { key: "变更摘要", label: "变更摘要", width: 300 },
        { key: "操作者", label: "操作者" },
        { key: "IP", label: "IP" },
        { key: "来源", label: "来源", width: 90 },
        { key: "已撤销", label: "已撤销", width: 90 },
      ],
      style: { zebra: true, border: true },
    },
    createdBy,
  });

  /* ============================================================
   * 8) 报表：权限审计季报
   * ============================================================ */
  await upsertReport({
    tenantId,
    reportCode: "compliance_permissions_quarterly",
    reportName: "权限分配审计季报",
    description: "等保要求：季度权限审计",
    datasetId: permDataset.dataset_id,
    config: {
      columns: [
        { key: "用户名", label: "用户名" },
        { key: "姓名", label: "姓名" },
        { key: "角色", label: "角色" },
        { key: "角色编码", label: "角色编码", width: 140 },
        { key: "数据范围", label: "数据范围", width: 90 },
        { key: "权限点", label: "权限点", width: 400 },
        { key: "用户状态", label: "用户状态", width: 90 },
      ],
      style: { zebra: true, border: true },
    },
    createdBy,
  });

  logger.info({ tenantId }, "[compliance] 合规报表模板初始化完成");
}

/* ============================================================
 * 内部工具
 * ============================================================ */
async function upsertDataset(input: {
  tenantId: string;
  datasetCode: string;
  datasetName: string;
  description?: string;
  sql: string;
  params: any[];
  createdBy?: string;
}) {
  const existing = await prisma.rp_dataset.findFirst({
    where: {
      tenant_id: input.tenantId,
      dataset_code: input.datasetCode,
      is_deleted: 0,
    },
  });

  if (existing) {
    return prisma.rp_dataset.update({
      where: { dataset_id: existing.dataset_id },
      data: {
        dataset_name: input.datasetName,
        description: input.description,
        source_config: {
          sql: input.sql,
          enforceTenant: true,
          timeout: 60_000,
        } as any,
        params: input.params as any,
        updated_by: input.createdBy,
        updated_at: new Date(),
      },
    });
  }

  return prisma.rp_dataset.create({
    data: {
      tenant_id: input.tenantId,
      dataset_code: input.datasetCode,
      dataset_name: input.datasetName,
      description: input.description ?? null,
      category: "compliance",
      dataset_type: "sql",
      source_config: {
        sql: input.sql,
        enforceTenant: true,
        timeout: 60_000,
      } as any,
      params: input.params as any,
      status: "1",
      created_by: input.createdBy,
      updated_by: input.createdBy,
    },
  });
}

async function upsertReport(input: {
  tenantId: string;
  reportCode: string;
  reportName: string;
  description?: string;
  datasetId: string;
  config: any;
  params?: any[];
  createdBy?: string;
}) {
  const existing = await prisma.rp_report.findFirst({
    where: {
      tenant_id: input.tenantId,
      report_code: input.reportCode,
      is_deleted: 0,
    },
  });

  if (existing) {
    return prisma.rp_report.update({
      where: { report_id: existing.report_id },
      data: {
        report_name: input.reportName,
        description: input.description,
        dataset_id: input.datasetId,
        config: input.config as any,
        params: (input.params ?? null) as any,
        updated_by: input.createdBy,
        updated_at: new Date(),
      },
    });
  }

  return prisma.rp_report.create({
    data: {
      tenant_id: input.tenantId,
      report_code: input.reportCode,
      report_name: input.reportName,
      description: input.description ?? null,
      category: "compliance",
      dataset_id: input.datasetId,
      config: input.config as any,
      params: (input.params ?? null) as any,
      status: "1",
      created_by: input.createdBy,
      updated_by: input.createdBy,
    },
  });
}
