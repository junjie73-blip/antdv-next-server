-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('SINGLE', 'CHUNKED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadType" "UploadType" NOT NULL DEFAULT 'SINGLE',
    "totalChunks" INTEGER NOT NULL DEFAULT 1,
    "chunks" INTEGER NOT NULL DEFAULT 0,
    "blobUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "file_uploads_uploadId_key" ON "file_uploads"("uploadId");

-- CreateIndex
CREATE INDEX "file_uploads_tenantId_status_idx" ON "file_uploads"("tenantId", "status");

-- CreateIndex
CREATE INDEX "file_uploads_uploadId_idx" ON "file_uploads"("uploadId");
