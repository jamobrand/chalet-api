/*
  Warnings:

  - You are about to drop the column `companyManagementId` on the `Chalet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Chalet" DROP CONSTRAINT "Chalet_companyManagementId_fkey";

-- AlterTable
ALTER TABLE "Chalet" DROP COLUMN "companyManagementId";
