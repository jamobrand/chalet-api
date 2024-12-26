import { z } from 'zod';

export const emailSchema = z.string().trim().email().min(1).max(255);
export const passwordSchema = z.string().trim().min(6).max(255);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'CHALET_OWNER', 'CUSTOMER']),
});
