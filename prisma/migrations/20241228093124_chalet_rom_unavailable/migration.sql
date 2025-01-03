-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Double', 'Twin');

-- CreateTable
CREATE TABLE "Chalet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletUniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "isEnsuite" BOOLEAN NOT NULL DEFAULT false,
    "roomCount" INTEGER NOT NULL,
    "isUnderMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "reasonForMaintenance" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chalet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "roomUniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "room" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaletAvailability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "chaletId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chalet_chaletUniqueId_key" ON "Chalet"("chaletUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Chalet_name_key" ON "Chalet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomUniqueId_key" ON "Room"("roomUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "ChaletAvailability_chaletId_date_key" ON "ChaletAvailability"("chaletId", "date");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaletAvailability" ADD CONSTRAINT "ChaletAvailability_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
