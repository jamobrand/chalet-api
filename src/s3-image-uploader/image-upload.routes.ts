import { Router } from 'express';
import { imageUploadController } from './image-upload.module';
import { validateImageUpload } from './validation/image-validation';
import { uploadMultiple, uploadSingle } from './image-upload.controller';

const imageUploadRoutes = Router();

// RECOMMENDED ROUTES (with automatic image processing)
/**
 * Upload and process multiple images
 * POST /api/images/upload
 * Content-Type: multipart/form-data
 * Body: FormData with 'images' field containing up to 10 image files
 *
 * This is the RECOMMENDED approach as it:
 * - Automatically resizes images to optimize storage
 * - Compresses images to reduce file size by 60-80%
 * - Creates thumbnails automatically
 * - Handles EXIF orientation
 * - Provides compression statistics
 */
imageUploadRoutes.post('/upload', uploadMultiple, imageUploadController.processAndUploadImages);

/**
 * Upload and process single image
 * POST /api/images/upload-single
 * Content-Type: multipart/form-data
 * Body: FormData with 'image' field containing single image file
 */
imageUploadRoutes.post(
  '/upload-single',
  uploadSingle,
  imageUploadController.processAndUploadSingleImage,
);

/**
 * Get image metadata without uploading
 * POST /api/images/metadata
 * Content-Type: multipart/form-data
 * Body: FormData with 'image' field containing single image file
 */
imageUploadRoutes.post('/metadata', uploadSingle, imageUploadController.getImageMetadata);

// LEGACY ROUTES (presigned URLs - client uploads directly)

/**
 * Generate presigned URLs for client-side uploads
 * POST /api/images/presigned-urls
 * Body: { images: [{ fileName: string, fileType: string, fileSize: number }] }
 *
 * Note: This bypasses image optimization. Use /upload endpoint instead.
 */
imageUploadRoutes.post(
  '/presigned-urls',
  validateImageUpload.multipleImages,
  imageUploadController.generatePresignedUrls,
);

/**
 * Generate single presigned URL for client-side upload
 * POST /api/images/presigned-url
 * Body: { fileName: string, fileType: string, fileSize: number }
 */
imageUploadRoutes.post(
  '/presigned-url',
  validateImageUpload.singleImage,
  imageUploadController.generateSinglePresignedUrl,
);

// DELETE ROUTES
/**
 * Delete single image
 * DELETE /api/images/:key
 * Params: key - The S3 key of the image to delete
 * Also deletes associated thumbnail
 */
imageUploadRoutes.delete('/:key', imageUploadController.deleteImage);

/**
 * Delete multiple images
 * DELETE /api/images/batch
 * Body: { keys: string[] }
 * Deletes all specified images and their thumbnails
 */
imageUploadRoutes.delete(
  '/batch',
  validateImageUpload.deleteMultiple,
  imageUploadController.deleteMultipleImages,
);

export default imageUploadRoutes;
