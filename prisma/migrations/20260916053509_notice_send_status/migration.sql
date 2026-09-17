-- AlterTable
ALTER TABLE "sys_notice" ADD COLUMN     "send_status" VARCHAR(1) DEFAULT '0',
ADD COLUMN     "send_time" TIMESTAMPTZ(6);
