/*
  Warnings:

  - You are about to drop the `ChaletAvailability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChaletAvailability" DROP CONSTRAINT "ChaletAvailability_chaletId_fkey";

-- DropTable
DROP TABLE "ChaletAvailability";

-- CreateTable
CREATE TABLE "ChaletUnavailableDates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletUnavailableDates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChaletUnavailableDates_chaletId_date_key" ON "ChaletUnavailableDates"("chaletId", "date");

-- AddForeignKey
ALTER TABLE "ChaletUnavailableDates" ADD CONSTRAINT "ChaletUnavailableDates_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
