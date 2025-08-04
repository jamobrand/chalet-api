export interface CreateTokenRequest {
  paymentAmount: number;
  paymentCurrency: string;
  companyRef: string;
  redirectUrl?: string;
  backUrl?: string;
  customer: CustomerDetails;
  services: ServiceDetails[];
  ptl?: number; // Payment Time Limit in hours
  defaultPayment?: 'MO' | 'PP' | 'BT' | 'XP' | 'SE' | 'CP' | 'CC';
  defaultPaymentCountry?: string;
  defaultPaymentMNO?: string;
  transactionSource?: 'API' | 'Mobile' | 'Web';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaData?: Record<string, any>;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  zip?: string;
}

export interface ServiceDetails {
  serviceType: number;
  serviceDescription: string;
  serviceDate: string; // Format: YYYY/MM/DD HH:mm
  serviceFrom?: string | undefined; // Explicitly allow undefined
  serviceTo?: string | undefined; // Explicitly allow undefined
}

export interface CreateTokenResponse {
  result: string;
  resultExplanation: string;
  transToken?: string;
  transRef?: string;
  notes?: string;
}
export interface VerifyTokenRequest {
  transactionToken?: string | undefined;
  companyRef?: string | undefined;
  verifyTransaction?: boolean;
}

export interface VerifyTokenResponse {
  result: string;
  resultExplanation: string;
  customerName?: string;
  customerCredit?: string;
  customerCreditType?: string;
  transactionApproval?: string;
  transactionCurrency?: string;
  transactionAmount?: number | undefined;
  fraudAlert?: string;
  fraudExplanation?: string;
  transactionNetAmount?: number | undefined;
  transactionSettlementDate?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerAddress?: string;
  customerCity?: string;
  customerZip?: string;
  mobilePaymentRequest?: string;
  accRef?: string;
}

export interface WebhookPayload {
  TransactionToken: string;
  CompanyRef: string;
  TransactionApproval: string;
  TransactionCurrency: string;
  TransactionAmount: string;
  CustomerName: string;
  CustomerCredit: string;
  CustomerCreditType: string;
  TransactionFinalCurrency: string;
  TransactionFinalAmount: string;
  FraudAlert: string;
  FraudExplanation: string;
}
