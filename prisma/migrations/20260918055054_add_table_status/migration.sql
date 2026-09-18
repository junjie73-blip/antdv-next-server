/*
  Warnings:

  - You are about to drop the column `gen_path` on the `gen_table` table. All the data in the column will be lost.
  - You are about to drop the column `gen_type` on the `gen_table` table. All the data in the column will be lost.
  - You are about to drop the column `parent_menu_id` on the `gen_table` table. All the data in the column will be lost.
  - You are about to alter the column `ts_type` on the `gen_table_column` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "gen_table" DROP COLUMN "gen_path",
DROP COLUMN "gen_type",
DROP COLUMN "parent_menu_id",
ADD COLUMN     "table_status" VARCHAR(20) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "gen_table_column" ADD COLUMN     "default_value" VARCHAR(200),
ADD COLUMN     "is_sort" CHAR(1) NOT NULL DEFAULT '0',
ALTER COLUMN "ts_type" SET DATA TYPE VARCHAR(50);
