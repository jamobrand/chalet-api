/*
  Warnings:

  - A unique constraint covering the columns `[bookingReference]` on the table `ChaletBooking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChaletBooking" ADD COLUMN     "bookingReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChaletBooking_bookingReference_key" ON "ChaletBooking"("bookingReference");
