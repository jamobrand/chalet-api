// dto/create-payment-booking.dto.ts - Updated with payment method preference
import { ServiceDetails } from '../../dpo-payment/types/dpo.types';

export interface CreatePaymentTokenDto {
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
  // Make services optional - will be auto-generated if not provided
  services?: ServiceDetails[];
  // Optional: Allow specifying preferred payment method
  preferredPaymentMethod?: 'MO' | 'PP' | 'BT' | 'XP' | 'SE' | 'CP' | 'CC';
}
