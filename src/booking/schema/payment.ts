import { z } from 'zod';

// Service details schema
const serviceDetailsSchema = z.object({
  serviceType: z.number().int().min(1),
  serviceDescription: z.string().min(1).max(500),
  serviceDate: z.string().refine(
    (date) => {
      // Validate YYYY/MM/DD HH:mm format
      const regex = /^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}$/;
      return regex.test(date);
    },
    {
      message: 'Service date must be in format YYYY/MM/DD HH:mm',
    },
  ),
  serviceFrom: z.string().optional(),
  serviceTo: z.string().optional(),
});

// Validation schemas
export const createPaymentTokenSchema = z.object({
  chaletId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  totalCost: z.number().positive(),
  selectedDates: z.array(z.string().datetime()),
  addons: z
    .array(
      z.object({
        addonId: z.string().uuid(),
        quantity: z.number().int().min(1),
        price: z.number().min(0),
      }),
    )
    .optional()
    .default([]),
  customer: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    address: z.string().min(1).max(500),
    nationality: z.string().min(1).max(100),
    nationalIdNumber: z.string().min(1).max(50),
  }),
  // Add services validation - can be auto-generated or provided
  services: z.array(serviceDetailsSchema).optional(),
});

export const verifyPaymentSchema = z.object({
  reservationReference: z.string().min(1),
});

// Helper function to generate services from booking data
export const generateBookingServices = (checkIn: string, chaletName: string = 'Chalet Booking') => {
  const checkInDate = new Date(checkIn);

  const formatServiceDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  return [
    {
      serviceType: 54841, // Use the test service type provided by DPO
      serviceDescription: `${chaletName} - Accommodation Booking`,
      serviceDate: formatServiceDate(checkInDate),
      // Remove serviceFrom and serviceTo since they're not applicable for chalet bookings
      // and DPO expects 2-3 character location codes, not datetime strings
    },
  ];
};
