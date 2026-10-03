import { prisma } from "@/config/database.js";
import {
  ExportContext,
  ExportHandler,
  ExportResult,
} from "@/modules/export/handlers/types.js";

const BATCH_SIZE = 2000;

export const orgHistoryExportHandler: ExportHandler = {
  bizType: "org_history",
  label: "组织架构变更历史",
  columns: [],
  async execute(ctx: ExportContext): Promise<ExportResult> {
    const { tenantId, queryParams } = ctx;
    const where: any = { tenant_id: tenantId };
    if (queryParams.entityType) where.entity_type = queryParams.entityType;
    if (queryParams.scope) where.scope = queryParams.scope;
    if (queryParams.changeType) where.change_type = queryParams.changeType;
    if (queryParams.operatorId) where.operator_id = queryParams.operatorId;
    if (queryParams.startTime || queryParams.endTime) {
      where.created_at = {};
      if (queryParams.startTime)
        where.created_at.gte = new Date(queryParams.startTime);
      if (queryParams.endTime)
        where.created_at.lte = new Date(queryParams.endTime);
    }

    const totalCount = await prisma.sys_org_history.count({ where });

    const scopeText: Record<string, string> = {
      dept_tree: "部门调整",
      user_profile: "个人信息",
      user_dept: "部门关系",
      user_role: "角色变更",
      position: "岗位",
    };
    const changeTypeText: Record<string, string> = {
      create: "创建",
      update: "更新",
      delete: "删除",
      move: "移动",
      transfer: "调动",
      assign: "分配",
      revoke: "移除",
    };

    async function* rows() {
      let cursor: string | undefined;
      while (true) {
        const batch = await prisma.sys_org_history.findMany({
          where,
          take: BATCH_SIZE,
          ...(cursor ? { skip: 1, cursor: { history_id: cursor } } : {}),
          orderBy: { history_id: "asc" },
        });
        if (batch.length === 0) break;
        for (const h of batch) {
          yield {
            变更时间: h.created_at.toISOString().slice(0, 19).replace("T", " "),
            范围: scopeText[h.scope ?? ""] ?? h.scope ?? "",
            变更类型: changeTypeText[h.change_type] ?? h.change_type,
            摘要: h.summary ?? "",
            实体类型: h.entity_type,
            实体ID: h.entity_id,
            操作者: h.operator_name ?? "系统",
            IP: h.ip_address ?? "",
            来源: h.source ?? "",
            已撤销: h.reverted_at ? "是" : "否",
            撤销原因: h.revert_reason ?? "",
          };
        }
        cursor = batch[batch.length - 1].history_id;
        if (batch.length < BATCH_SIZE) break;
      }
    }

    return {
      rows: rows(),
      totalCount,
      fileBaseName: `org-history-${Date.now()}`,
    };
  },
};
