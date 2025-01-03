/*
  Warnings:

  - Added the required column `totalCost` to the `ChaletBooking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'FULLY_PAID', 'PARTIALLY_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'MOBILE_MONEY');

-- AlterTable
ALTER TABLE "BookingDate" ALTER COLUMN "date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ChaletBooking" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalCost" DECIMAL(10,2) NOT NULL;

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "transactionId" TEXT,
    "receiptNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_uniqueId_key" ON "Payment"("uniqueId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
