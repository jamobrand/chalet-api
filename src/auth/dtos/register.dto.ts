import { UserRole } from '@prisma/client';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
