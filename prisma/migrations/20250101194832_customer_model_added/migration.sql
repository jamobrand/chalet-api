/*
  Warnings:

  - Added the required column `customerId` to the `ChaletBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChaletBooking" ADD COLUMN     "customerId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT,
    "addresss" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "nationality" TEXT,
    "passportNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_uniqueId_key" ON "Customer"("uniqueId");

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
