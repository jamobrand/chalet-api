-- CreateTable
CREATE TABLE "ChaletBooking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "numberOfAdults" INTEGER NOT NULL,
    "numberOfChildren" INTEGER NOT NULL,
    "totalGuests" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3) NOT NULL,
    "bookingId" UUID NOT NULL,

    CONSTRAINT "BookingDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChaletBooking_chaletId_idx" ON "ChaletBooking"("chaletId");

-- CreateIndex
CREATE INDEX "ChaletBooking_checkIn_checkOut_idx" ON "ChaletBooking"("checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "BookingDate_date_idx" ON "BookingDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDate_bookingId_date_key" ON "BookingDate"("bookingId", "date");

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDate" ADD CONSTRAINT "BookingDate_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
