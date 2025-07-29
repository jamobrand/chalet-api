export interface ChaletReserveDto {
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  totalCost: number;
  // rooms: { adults: number; children: number }[];
  chaletId: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    nationality: string;
    nationalIdNumber: string;
  };
  selectedDates:Date[];
  addons:addon[]
  paymentStatus: string;
  payment: {
    amount: number;
    paymentMethod: string;
    transactionId: string | null;
    date?: Date;
    status: string;
    notes: string | null;
  };
  specialRequests: string;
}

interface addon {
  addonId: string,
  quantity: number,
  price: string
}