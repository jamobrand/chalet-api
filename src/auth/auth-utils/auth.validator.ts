import { z } from 'zod';

export const emailSchema = z.string().trim().email().min(1).max(255);
export const passwordSchema = z.string().trim().min(6).max(255);
export const verificationCodeSchema = z.string().trim().min(1).max(25);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'CHALET_OWNER', 'CUSTOMER']),
});

export const verificationEmailSchema = z.object({
  code: verificationCodeSchema,
});

export const userIdSchema = z.object({
  userId: z.string().trim().min(1).max(25),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
