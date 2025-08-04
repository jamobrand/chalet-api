import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { VerifyTokenResponse } from '../dpo-payment/types/dpo.types';

/**
 * Map DPO payment method to your PaymentMethod enum
 * DPO uses various payment methods that need to be mapped to your schema
 */
export function mapDPOPaymentMethod(
  verificationResponse: VerifyTokenResponse,
  defaultPayment?: string,
): PaymentMethod {
  // Check customer credit type or default payment method from DPO response
  const creditType = verificationResponse.customerCreditType?.toLowerCase();
  const mobilePaymentRequest = verificationResponse.mobilePaymentRequest;

  // Map based on DPO response indicators
  if (mobilePaymentRequest || creditType?.includes('mobile') || creditType?.includes('mpesa')) {
    return 'MOBILE_MONEY';
  }

  if (creditType?.includes('bank') || creditType?.includes('transfer')) {
    return 'BANK_TRANSFER';
  }

  if (
    creditType?.includes('card') ||
    creditType?.includes('credit') ||
    creditType?.includes('visa') ||
    creditType?.includes('mastercard')
  ) {
    return 'CREDIT_CARD';
  }

  // Check default payment method if provided during token creation
  if (defaultPayment) {
    switch (defaultPayment.toUpperCase()) {
      case 'MO': // Mobile Money
        return 'MOBILE_MONEY';
      case 'BT': // Bank Transfer
        return 'BANK_TRANSFER';
      case 'CC': // Credit Card
      case 'XP': // Express Checkout
        return 'CREDIT_CARD';
      default:
        return 'CREDIT_CARD'; // Default fallback
    }
  }

  // Default to credit card if we can't determine the method
  return 'CREDIT_CARD';
}

/**
 * Map DPO transaction approval status to your PaymentStatus enum
 */
export function mapDPOPaymentStatus(verificationResponse: VerifyTokenResponse): PaymentStatus {
  const approval = verificationResponse.transactionApproval?.toLowerCase();
  const result = verificationResponse.result;

  // Check if payment was successful
  if (result === '000' && (approval === 'y' || approval === 'approved')) {
    return 'FULLY_PAID';
  }

  // Check for pending status
  if (result === '000' && approval === 'pending') {
    return 'PENDING';
  }

  // Check for partial payment (if DPO supports it)
  if (result === '000' && approval === 'partial') {
    return 'PARTIALLY_PAID';
  }

  // Check for refunded status
  if (approval?.includes('refund')) {
    return 'REFUNDED';
  }

  // Default to unpaid for any other status
  return 'UNPAID';
}

/**
 * Validate payment amount matches expected amount
 */
export function validatePaymentAmount(
  expectedAmount: number,
  actualAmount: number | undefined,
  tolerance: number = 0.01,
): boolean {
  if (!actualAmount) return false;

  const difference = Math.abs(expectedAmount - actualAmount);
  return difference <= tolerance;
}

/**
 * Get human-readable payment method name
 */
export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  const displayNames: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    CREDIT_CARD: 'Credit/Debit Card',
    BANK_TRANSFER: 'Bank Transfer',
    MOBILE_MONEY: 'Mobile Money',
  };

  return displayNames[method] || method;
}

/**
 * Get human-readable payment status name
 */
export function getPaymentStatusDisplayName(status: PaymentStatus): string {
  const displayNames: Record<PaymentStatus, string> = {
    UNPAID: 'Unpaid',
    PENDING: 'Pending',
    FULLY_PAID: 'Fully Paid',
    PARTIALLY_PAID: 'Partially Paid',
    REFUNDED: 'Refunded',
  };

  return displayNames[status] || status;
}

/**
 * Check if payment status indicates successful payment
 */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
  return status === 'FULLY_PAID' || status === 'PARTIALLY_PAID';
}

/**
 * Enhanced payment validation with detailed error messages
 */
export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDPOPayment(
  verificationResponse: VerifyTokenResponse,
  expectedAmount: number,
  expectedCurrency: string = 'KES',
): PaymentValidationResult {
  const result: PaymentValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  // Check if DPO verification was successful
  if (verificationResponse.result !== '000') {
    result.isValid = false;
    result.errors.push(`DPO verification failed: ${verificationResponse.resultExplanation}`);
  }

  // Check payment approval
  const approval = verificationResponse.transactionApproval?.toLowerCase();
  if (approval !== 'y' && approval !== 'approved') {
    result.isValid = false;
    result.errors.push(`Payment not approved. Status: ${verificationResponse.transactionApproval}`);
  }

  // Validate amount
  if (verificationResponse.transactionAmount) {
    if (!validatePaymentAmount(expectedAmount, verificationResponse.transactionAmount)) {
      result.isValid = false;
      result.errors.push(
        `Amount mismatch. Expected: ${expectedAmount}, Received: ${verificationResponse.transactionAmount}`,
      );
    }
  } else {
    result.warnings.push('Transaction amount not provided in DPO response');
  }

  // Validate currency
  if (
    verificationResponse.transactionCurrency &&
    verificationResponse.transactionCurrency !== expectedCurrency
  ) {
    result.isValid = false;
    result.errors.push(
      `Currency mismatch. Expected: ${expectedCurrency}, Received: ${verificationResponse.transactionCurrency}`,
    );
  }

  // Check for fraud alerts
  if (verificationResponse.fraudAlert === 'Y') {
    result.isValid = false;
    result.errors.push(`Fraud alert: ${verificationResponse.fraudExplanation}`);
  }

  return result;
}
