-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_chaletId_fkey";

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
