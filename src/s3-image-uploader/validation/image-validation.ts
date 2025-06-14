import { NextFunction, Request, Response } from 'express';
import { BadRequestException } from '../../common/utils/catch-errors';
import { z } from 'zod';

// Zod schemas for validation
const PresignedUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(15 * 1024 * 1024), // 15MB
});

const MultipleImagesSchema = z.object({
  images: z.array(PresignedUrlRequestSchema).min(1).max(10),
});

const SingleImageSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/),
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(15 * 1024 * 1024),
});

const DeleteMultipleSchema = z.object({
  keys: z.array(z.string().min(1)).min(1).max(20),
});

// Generic validation middleware factory
const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new BadRequestException(`Validation failed: ${errorMessages}`);
      }
      throw error;
    }
  };
};

// Export validation middlewares
export const validateImageUpload = {
  multipleImages: createValidationMiddleware(MultipleImagesSchema),
  singleImage: createValidationMiddleware(SingleImageSchema),
  deleteMultiple: createValidationMiddleware(DeleteMultipleSchema),
};
