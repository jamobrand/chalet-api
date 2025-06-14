export interface CreateAddonDto {
  name: string;
  description: string | null;
  price: string;
}

export interface UpdateAddonDto {
  name: string;
  description: string | null;
  price: string;
}
