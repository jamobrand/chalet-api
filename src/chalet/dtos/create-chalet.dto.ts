import { RoomTypeEnum } from '../../common/enum/role.enum';

interface ChaletData {
  name: string;
  type: string;
  description: string;
  basePrice: number;
  roomCount: number;
  isEnsuite: boolean;
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
  capacity: number;
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
  label:string;
  isMain:boolean;
}

export interface ChaletDataDto {
  chaletDetails: ChaletData;
  location: Location;
  roomDetails: Room[];
  amenities: Amenities;
  availability: UnavailableDates;
  images: ImageData[];
}
