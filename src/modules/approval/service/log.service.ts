import {
  ApprovalLogRepository,
  type ApprovalLogRaw,
} from "../repository/log.repository.js";
import { APPROVAL_ACTION_LABEL, type ApprovalLogVO } from "../types.js";
import type { ApprovalLogQueryDTO } from "../schema.js";
import { BaseService } from "@/core/index.js";

export class ApprovalLogService extends BaseService<ApprovalLogRepository> {
  constructor(repository: ApprovalLogRepository) {
    super(repository);
  }

  async getLogPage(dto: ApprovalLogQueryDTO, tenantId: string) {
    const { list, total } = await this.repository.findLogPage(dto, tenantId);
    if (list.length === 0) return { list: [], total };

    const requestIds = [...new Set(list.map((l) => l.request_id))];
    const titleMap = await this.repository.findRequestTitles(
      requestIds,
      tenantId,
    );

    const items: ApprovalLogVO[] = list.map((l) => this.toVO(l, titleMap));
    return { list: items, total };
  }

  private toVO(
    l: ApprovalLogRaw,
    titleMap: Map<string, string>,
  ): ApprovalLogVO {
    return {
      log_id: l.log_id,
      request_id: l.request_id,
      request_title: titleMap.get(l.request_id) ?? null,
      operator_id: l.operator_id,
      operator_name: l.operator_name,
      action: l.action,
      action_label: APPROVAL_ACTION_LABEL[l.action] ?? l.action,
      from_status: l.from_status,
      to_status: l.to_status,
      remark: l.remark,
      reason_type: l.reason_type,
      created_at: l.created_at,
    };
  }
}
