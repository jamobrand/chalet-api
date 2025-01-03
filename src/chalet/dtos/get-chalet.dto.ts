import { ChaletAmenity, Prisma } from '@prisma/client';
import { Room } from './create-chalet.dto';

interface ImageData {
    file?: File;
    url: string;
    alt: string;
    key: string;
    label:string;
    isMain:boolean;
  }
  
export interface AvailabilityCalendar {
  date: Date;
  isAvailable: boolean;
}

export interface ChaletWithAvailability {
  id: string;
  chaletUniqueId: string;
  name: string;
  type: string;
  description: string | null;
  basePrice: Prisma.Decimal;
  isEnsuite: boolean;
  roomCount: number;
  isUnderMaintenance: boolean;
  reasonForMaintenance: string;
  locationName: string;
  address: string;
  coordinates: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  rooms: Room[];
  amenities: ChaletAmenity[];
  images: ImageData[];
  availabilityCalendar: AvailabilityCalendar[];
}

// Define a type that matches the Prisma Chalet structure
export type ChaletWithRelations = Prisma.ChaletGetPayload<{
  include: {
    rooms: true;
    amenities: true;
    images: true;
    ChaletUnavailableDates: true;
    bookings: {
      include: {
        bookingDates: true;
      };
    };
  };
}>;

// interface AvailabilityRange {
//   startDate: Date;
//   endDate: Date;
//   displayText: string;
// }