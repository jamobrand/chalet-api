/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ChaletAmenity` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "key" TEXT,
ADD COLUMN     "label" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChaletAmenity_name_key" ON "ChaletAmenity"("name");

-- CreateIndex
CREATE INDEX "ChaletAmenity_name_idx" ON "ChaletAmenity"("name");
