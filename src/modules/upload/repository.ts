import { BaseRepository } from "@common/core/base-repository.js";
import { prisma } from "@config/database.js";
import { redis } from "@config/redis.js";

export class UploadRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.fileUpload);
  }

  async create(data: {
    uploadId: string;
    tenantId: string;
    userId?: string;
    filename: string;
    mimeType: string;
    size: number;
    totalChunks: number;
    uploadType?: string;
  }) {
    return prisma.fileUpload.create({
      data: {
        ...data,
        uploadType: (data.uploadType as any) || "SINGLE",
      } as any,
    });
  }

  async findByUploadId(uploadId: string) {
    return prisma.fileUpload.findUnique({ where: { uploadId } });
  }

  async findByTenant(tenantId: string, page = 1, limit = 20, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.fileUpload.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateChunkProgress(uploadId: string, chunkIndex: number) {
    await redis.sadd(`upload:${uploadId}:chunks`, String(chunkIndex));
    return redis.scard(`upload:${uploadId}:chunks`);
  }

  async getChunkProgress(uploadId: string) {
    return redis.smembers(`upload:${uploadId}:chunks`);
  }

  async complete(uploadId: string, blobUrl: string) {
    const [record] = await Promise.all([
      prisma.fileUpload.update({
        where: { uploadId },
        data: { status: "COMPLETED", blobUrl, chunks: { increment: 1 } },
      }),
      redis.del(`upload:${uploadId}:chunks`),
    ]);
    return record;
  }

  async deleteById(id: string, tenantId: string) {
    return prisma.fileUpload.deleteMany({
      where: { id, tenantId },
    });
  }
}
