-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'CHALET_OWNER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('Active', 'Inactive', 'Pending');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'FULLY_PAID', 'PARTIALLY_PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "AmenityCategory" AS ENUM ('KITCHEN', 'ENTERTAINMENT', 'OUTDOOR', 'BEDROOM', 'GENERAL');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'TWO_FACTOR');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('Double', 'Twin');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('STANDALONE', 'DUPLEX_UPPER', 'DUPLEX_LOWER');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastLogin" TIMESTAMP(3),
    "lastPasswordChange" TIMESTAMP(3),
    "loginHistory" TIMESTAMP(3)[],
    "country" TEXT,
    "status" "UserAccountStatus" NOT NULL DEFAULT 'Inactive',
    "userAgent" TEXT,
    "photoId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "image" TEXT NOT NULL DEFAULT 'https://via.placeholder.com/250',
    "name" TEXT NOT NULL DEFAULT 'Default Photo',
    "isGravatar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userAccountId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyManagement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL DEFAULT 20.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyManagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "userAccountId" UUID,
    "companyManagementId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "walletId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "paymentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalPrice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "SeasonalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chalet" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletUniqueId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL DEFAULT 'STANDALONE',
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "weekendPrice" DECIMAL(10,2),
    "roomCount" INTEGER NOT NULL DEFAULT 0,
    "isEnsuite" BOOLEAN NOT NULL DEFAULT false,
    "totalWashrooms" INTEGER NOT NULL DEFAULT 0,
    "totalFloors" INTEGER NOT NULL DEFAULT 1,
    "hasUpstairsLounge" BOOLEAN NOT NULL DEFAULT false,
    "hasDownstairsLounge" BOOLEAN NOT NULL DEFAULT false,
    "maxAdults" INTEGER NOT NULL,
    "maxChildren" INTEGER NOT NULL,
    "totalSleeps" INTEGER NOT NULL,
    "isUnderMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "reasonForMaintenance" TEXT,
    "locationName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "ownerId" UUID NOT NULL,
    "companyManagementId" UUID NOT NULL,
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
    "floor" INTEGER NOT NULL DEFAULT 1,
    "notEnsuite" BOOLEAN NOT NULL DEFAULT false,
    "hasBunkBed" BOOLEAN NOT NULL DEFAULT false,
    "bunkBedCapacity" INTEGER,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaletUnavailableDates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletUnavailableDates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "key" TEXT,
    "label" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "chaletId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaletAmenity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AmenityCategory" NOT NULL DEFAULT 'GENERAL',
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChaletAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChaletBooking" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chaletId" UUID NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "numberOfAdults" INTEGER NOT NULL,
    "numberOfChildren" INTEGER NOT NULL,
    "totalGuests" INTEGER NOT NULL,
    "totalCost" DECIMAL(10,2) NOT NULL,
    "customerId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaletBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingDate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" TIMESTAMP(3),
    "bookingId" UUID NOT NULL,

    CONSTRAINT "BookingDate_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "_ChaletToChaletAmenity" (
    "A" UUID NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE INDEX "UserAccount_email_idx" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_code_key" ON "VerificationCode"("code");

-- CreateIndex
CREATE INDEX "VerificationCode_userAccountId_idx" ON "VerificationCode"("userAccountId");

-- CreateIndex
CREATE INDEX "VerificationCode_code_idx" ON "VerificationCode"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userAccountId_key" ON "Wallet"("userAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_companyManagementId_key" ON "Wallet"("companyManagementId");

-- CreateIndex
CREATE UNIQUE INDEX "Chalet_chaletUniqueId_key" ON "Chalet"("chaletUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Chalet_name_key" ON "Chalet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_roomUniqueId_key" ON "Room"("roomUniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "ChaletUnavailableDates_chaletId_date_key" ON "ChaletUnavailableDates"("chaletId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChaletAmenity_name_key" ON "ChaletAmenity"("name");

-- CreateIndex
CREATE INDEX "ChaletAmenity_name_idx" ON "ChaletAmenity"("name");

-- CreateIndex
CREATE INDEX "ChaletAmenity_category_idx" ON "ChaletAmenity"("category");

-- CreateIndex
CREATE INDEX "ChaletBooking_chaletId_idx" ON "ChaletBooking"("chaletId");

-- CreateIndex
CREATE INDEX "ChaletBooking_checkIn_checkOut_idx" ON "ChaletBooking"("checkIn", "checkOut");

-- CreateIndex
CREATE INDEX "BookingDate_date_idx" ON "BookingDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDate_bookingId_date_key" ON "BookingDate"("bookingId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_uniqueId_key" ON "Payment"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_uniqueId_key" ON "Customer"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "AddOn_uniqueId_key" ON "AddOn"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_uniqueId_key" ON "BookingAddon"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_bookingId_addOnId_key" ON "BookingAddon"("bookingId", "addOnId");

-- CreateIndex
CREATE UNIQUE INDEX "ChaletRules_uniqueId_key" ON "ChaletRules"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "_ChaletToChaletAmenity_AB_unique" ON "_ChaletToChaletAmenity"("A", "B");

-- CreateIndex
CREATE INDEX "_ChaletToChaletAmenity_B_index" ON "_ChaletToChaletAmenity"("B");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "UserAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_companyManagementId_fkey" FOREIGN KEY ("companyManagementId") REFERENCES "CompanyManagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalPrice" ADD CONSTRAINT "SeasonalPrice_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chalet" ADD CONSTRAINT "Chalet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chalet" ADD CONSTRAINT "Chalet_companyManagementId_fkey" FOREIGN KEY ("companyManagementId") REFERENCES "CompanyManagement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaletUnavailableDates" ADD CONSTRAINT "ChaletUnavailableDates_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_chaletId_fkey" FOREIGN KEY ("chaletId") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChaletBooking" ADD CONSTRAINT "ChaletBooking_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingDate" ADD CONSTRAINT "BookingDate_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaletBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_addOnId_fkey" FOREIGN KEY ("addOnId") REFERENCES "AddOn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChaletToChaletAmenity" ADD CONSTRAINT "_ChaletToChaletAmenity_A_fkey" FOREIGN KEY ("A") REFERENCES "Chalet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChaletToChaletAmenity" ADD CONSTRAINT "_ChaletToChaletAmenity_B_fkey" FOREIGN KEY ("B") REFERENCES "ChaletAmenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
