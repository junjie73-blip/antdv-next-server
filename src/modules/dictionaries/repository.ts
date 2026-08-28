import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@/config/database.js";

export class DictionaryRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.dictionary);
  }

  async findByCode(tenantId: string, code: string) {
    return prisma.dictionary.findUnique({
      where: { tenantId_code_deletedAt: { tenantId, code, deletedAt: null } },
      include: {
        items: {
          where: { deletedAt: null, status: "ACTIVE" },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  }

  async findItems(tenantId: string, dictCode: string) {
    const dict = await this.findByCode(tenantId, dictCode);
    return dict?.items || [];
  }
}

export class DictionaryItemRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.dictionaryItem);
  }

  async findByDictId(tenantId: string, dictId: string, page = 1, limit = 100) {
    return this.findMany(tenantId, page, limit, { dictId });
  }
}
