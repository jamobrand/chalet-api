import { PropertyTypeEnum, RoomTypeEnum } from '../../common/enum/role.enum';

interface ChaletData {
  name: string;
  propertyType: PropertyTypeEnum;
  description: string;
  basePrice: number;
  weekendPrice?: number;
  totalWashrooms: number;
  totalFloors: number;
  hasUpstairsLounge: boolean;
  hasDownstairsLounge: boolean;
  maxAdults: number;
  maxChildren: number;
  totalSleeps: number;
  roomCount: number;
  isEnsuite: boolean;
  ownerId: string;
  companyManagementId?: string;
}

interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Room {
  roomType: RoomTypeEnum;
  room: number;
  floor: number;
  notEnsuite: boolean;
  hasBunked: boolean;
  capacity: number;
  bunkBedCapacity: number | null;
}

export interface Amenities {
  predefinedAmenities: string[];
  customAmenities: { name: string }[];
}

interface UnavailableDates {
  unavailableDates: Date[];
}

interface ImageData {
  file: File;
  url: string;
  alt: string;
  key: string;
  label: string;
  isMain: boolean;
}

export interface ChaletDataDto {
  chaletDetails: ChaletData;
  location: Location;
  roomDetails: Room[];
  amenities: Amenities;
  availability: UnavailableDates;
  images: ImageData[];
}
