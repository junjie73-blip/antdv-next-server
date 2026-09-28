-- AlterTable
ALTER TABLE "sys_menu" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_external" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keep_alive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "layout" VARCHAR(20),
ADD COLUMN     "micro_app" JSONB;
