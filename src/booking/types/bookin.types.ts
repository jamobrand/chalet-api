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
