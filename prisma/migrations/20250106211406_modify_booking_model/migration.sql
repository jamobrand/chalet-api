-- DropForeignKey
ALTER TABLE "ChaletBooking" DROP CONSTRAINT "ChaletBooking_createdById_fkey";

-- AlterTable
ALTER TABLE "ChaletBooking" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
