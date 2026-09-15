-- AlterTable
ALTER TABLE "sys_user" ADD COLUMN     "id_card" VARCHAR(18),
ADD COLUMN     "id_card_enc" TEXT,
ADD COLUMN     "id_card_hash" VARCHAR(64),
ADD COLUMN     "phone_enc" TEXT,
ADD COLUMN     "phone_hash" VARCHAR(64);
