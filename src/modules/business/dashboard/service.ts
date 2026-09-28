import { BaseService } from "@/core/base/service.js";
import { DashboardRepository } from "./repository.js";

export class DashboardService extends BaseService<DashboardRepository> {
  constructor(repository: DashboardRepository) {
    super(repository);
  }

  async getKpi(tenantId: string) {
    return this.repository.getKpi(tenantId);
  }
  async getActivityTrend(tenantId: string, range: string) {
    return this.repository.getActivityTrend(tenantId, range);
  }
  async getTrafficDistribution(tenantId: string) {
    return this.repository.getTrafficDistribution(tenantId);
  }
  async getSystemHealth(tenantId: string) {
    return this.repository.getSystemHealth(tenantId);
  }
  async getResourceUsage(tenantId: string) {
    return this.repository.getResourceUsage(tenantId);
  }
  async getErrorRateTrend(tenantId: string) {
    return this.repository.getErrorRateTrend(tenantId);
  }
  async getUserJourney(tenantId: string) {
    return this.repository.getUserJourney(tenantId);
  }
  async getModuleRank(tenantId: string) {
    return this.repository.getModuleRank(tenantId);
  }
}
