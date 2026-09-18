/*
  Warnings:

  - You are about to drop the column `sort_order` on the `gen_table_column` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "gen_table_column" DROP COLUMN "sort_order",
ADD COLUMN     "sort" INTEGER;
