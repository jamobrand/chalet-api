-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "dpoApprovalCode" TEXT,
ADD COLUMN     "dpoCustomerCredit" TEXT,
ADD COLUMN     "dpoFraudAlert" TEXT,
ADD COLUMN     "dpoSettlementDate" TEXT,
ADD COLUMN     "dpoTransToken" TEXT;
