import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@config/database.js";

export class TenantRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.tenant);
  }
}
