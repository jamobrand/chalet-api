-- CreateTable
CREATE TABLE "ChaletAmenity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChaletAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChaletToChaletAmenity" (
    "A" UUID NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChaletToChaletAmenity_AB_unique" ON "_ChaletToChaletAmenity"("A", "B");

-- CreateIndex
CREATE INDEX "_ChaletToChaletAmenity_B_index" ON "_ChaletToChaletAmenity"("B");

-- AddForeignKey
ALTER TABLE "_ChaletToChaletAmenity" ADD CONSTRAINT "_ChaletToChaletAmenity_A_fkey" FOREIGN KEY ("A") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChaletToChaletAmenity" ADD CONSTRAINT "_ChaletToChaletAmenity_B_fkey" FOREIGN KEY ("B") REFERENCES "ChaletAmenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
