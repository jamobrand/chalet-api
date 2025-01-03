-- CreateTable
CREATE TABLE "AddOn" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "addOnId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaletRules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletRules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_uniqueId_key" ON "AddOn"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_uniqueId_key" ON "BookingAddon"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_bookingId_addOnId_key" ON "BookingAddon"("bookingId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "ChaletRules_uniqueId_key" ON "ChaletRules"("uniqueId");

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
