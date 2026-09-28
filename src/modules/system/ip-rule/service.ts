import { BaseService } from "@/core/base/service.js";
import { IpRuleRepository } from "./repository.js";

export class IpRuleService extends BaseService<IpRuleRepository> {
  constructor(repository: IpRuleRepository) {
    super(repository);
  }

  async checkIp(ip: string, tenantId: string) {
    return this.repository.checkIp(ip, tenantId);
  }
}
