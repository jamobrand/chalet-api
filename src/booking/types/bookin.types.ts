// types/bookin.types.ts - Updated with defaultPayment field
export interface PendingReservation {
  id: string;
  chaletId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  totalCost: number;
  selectedDates: string[];
  addons: Array<{
    addonId: string;
    quantity: number;
    price: number;
  }>;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    nationality: string;
    nationalIdNumber: string;
  };
  transToken?: string;
  defaultPayment?: string; // Store the DPO payment method used
  expiresAt: Date;
  createdAt: Date;
}

// Add this interface to your types file
export interface DPOWebhookPayload {
  // Always present fields
  CompanyRef: string; // Your reservation reference
  TransToken: string; // DPO transaction token
  Result: string; // Result code ('000', '001', etc.)

  // Usually present fields
  ResultExplanation?: string; // Human readable result
  TransactionApproval?: string; // Approval code (can be empty for failed payments)
  TransactionCurrency?: string; // Currency code
  TransactionAmount?: number; // Amount paid

  // Customer fields (optional)
  CustomerName?: string;
  CustomerCredit?: string;
  CustomerCreditType?: string;
  CustomerPhone?: string;
  CustomerAddress?: string;
  CustomerCountry?: string;
  CustomerCity?: string;
  CustomerZip?: string;

  // Transaction details (optional)
  AccRef?: string; // Account reference
  TransactionNetAmount?: number;
  TransactionSettlementDate?: string;

  // Risk/fraud fields (optional)
  FraudAlert?: string;
  FraudExplanation?: string;

  // Mobile payment specific (optional)
  MobilePaymentRequest?: string;
}
