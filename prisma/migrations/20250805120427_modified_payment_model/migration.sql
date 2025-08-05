-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "dpoCurrency" TEXT,
ADD COLUMN     "dpoCustomerCreditType" TEXT,
ADD COLUMN     "dpoFraudAlertCode" TEXT,
ADD COLUMN     "dpoFraudExplanation" TEXT,
ADD COLUMN     "dpoResultCode" TEXT,
ADD COLUMN     "dpoResultExplanation" TEXT,
ADD COLUMN     "dpoTransactionAmount" DECIMAL(12,2),
ADD COLUMN     "dpoTransactionNetAmount" DECIMAL(12,2);
