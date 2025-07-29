import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import multer from 'multer';
import { BadRequestException } from '../common/utils/catch-errors';
import { asyncHandler } from '../common/utils/asyncHandler';
import { ImageUploadRequest, ProcessedImageUploadRequest, S3Service } from './s3.service';
import { logger } from '../common/utils/logger';

// Configure multer for memory storage (we'll process images in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB per file (larger than your 20MB images)
    files: 15, // Maximum 15 files (more than your 10 limit)
    fieldSize: 250 * 1024 * 1024, // 200MB total field data
    fieldNameSize: 1024, // Field name size
    fields: 100, // Maximum number of fields
    parts: 1000, // Maximum number of parts
  },
  fileFilter: (_req, file, cb) => {
    logger.info(
      `Processing file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`,
    );
    // Enhanced file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    // const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    // const isValidMimeType = allowedTypes.includes(file.mimetype);
    // const hasValidExtension = allowedExtensions.some((ext) =>
    //   file.originalname.toLowerCase().endsWith(ext),
    // );

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      logger.warn(`Rejected file: ${file.originalname} - Invalid type: ${file.mimetype}`);
      cb(new BadRequestException(`File type ${file.mimetype} is not allowed`));
    }
  },
});

export class ImageUploadController {
  private s3Service: S3Service;

  constructor(s3Service: S3Service) {
    this.s3Service = s3Service;
  }

  /**
   * Get multer middleware for handling multipart uploads with enhanced error handling
   */
  public getUploadMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const uploadHandler = upload.array('images', 15);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      uploadHandler(req, res, (err: any) => {
        const uploadTime = Date.now() - startTime;
        logger.info(`Multer processing completed in ${uploadTime}ms`);

        if (err) {
          logger.error('Multer error:', {
            error: err.message,
            code: err.code,
            field: err.field,
            uploadTime,
          });

          if (err instanceof multer.MulterError) {
            switch (err.code) {
              case 'LIMIT_FILE_SIZE':
                return res.status(413).json({
                  error: 'File too large',
                  message: 'File size exceeds 25MB limit',
                  code: 'FILE_TOO_LARGE',
                });
              case 'LIMIT_FILE_COUNT':
                return res.status(413).json({
                  error: 'Too many files',
                  message: 'Maximum 15 files allowed',
                  code: 'TOO_MANY_FILES',
                });
              case 'LIMIT_FIELD_VALUE':
                return res.status(413).json({
                  error: 'Field value too large',
                  message: 'Total upload size exceeds 200MB limit',
                  code: 'FIELD_TOO_LARGE',
                });
              case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                  error: 'Unexpected field',
                  message: 'Unexpected file field',
                  code: 'UNEXPECTED_FIELD',
                });
              default:
                return res.status(400).json({
                  error: 'Upload error',
                  message: err.message,
                  code: 'UPLOAD_ERROR',
                });
            }
          }

          return res.status(400).json({
            error: 'Upload failed',
            message: err.message || 'Unknown upload error',
            code: 'GENERAL_ERROR',
          });
        }

        // Log successful multer processing
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
          const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
          logger.info(
            `Multer successfully processed ${files.length} files, total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`,
          );
        }

        next();
      });
    };
  }

  /**
   * Process and upload images directly (RECOMMENDED)
   * POST /api/images/upload
   * Content-Type: multipart/form-data
   */

  public processAndUploadImages = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const processingStartTime = Date.now();
      const files = req.files as Express.Multer.File[];

      logger.info(`=== Starting image processing for ${files?.length || 0} files ===`);

      if (!files || files.length === 0) {
        throw new BadRequestException('No images provided');
      }

      if (files.length > 15) {
        throw new BadRequestException('Maximum 15 images allowed per upload');
      }

      // Validate files and log detailed information
      let totalSize = 0;
      files.map((file, index) => {
        const fileSize = file.size || file.buffer?.length || 0;
        totalSize += fileSize;

        const details = {
          index: index + 1,
          name: file.originalname,
          size: fileSize,
          sizeFormatted: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
          type: file.mimetype,
          bufferLength: file.buffer?.length || 0,
        };

        logger.info(`File ${index + 1} details:`, details);
        return details;
      });

      logger.info(`Total upload size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

      // Check for corrupted or empty files
      const invalidFiles = files.filter((file) => !file.buffer || file.buffer.length === 0);
      if (invalidFiles.length > 0) {
        logger.error(
          `Found ${invalidFiles.length} invalid/empty files:`,
          invalidFiles.map((f) => f.originalname),
        );
        throw new BadRequestException(
          `${invalidFiles.length} files appear to be corrupted or empty`,
        );
      }

      try {
        // Prepare requests for processing
        const processRequests: ProcessedImageUploadRequest[] = files.map((file) => ({
          fileName: file.originalname,
          fileBuffer: file.buffer,
          fileType: file.mimetype,
        }));

        logger.info('Starting S3 service processing...');
        const serviceStartTime = Date.now();

        const results = await this.s3Service.processAndUploadMultipleImages(processRequests);

        const serviceTime = Date.now() - serviceStartTime;
        const totalTime = Date.now() - processingStartTime;

        // Calculate compression stats
        const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
        const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
        const overallCompressionRatio =
          totalOriginalSize > 0
            ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(2)
            : '0';

        const stats = {
          totalImages: results.length,
          totalOriginalSize: `${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`,
          totalCompressedSize: `${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`,
          overallCompressionRatio: `${overallCompressionRatio}%`,
          spaceSaved: `${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)}MB`,
          processingTime: {
            total: `${totalTime}ms`,
            service: `${serviceTime}ms`,
            average: `${(serviceTime / results.length).toFixed(0)}ms per image`,
          },
        };

        logger.info('=== Upload completed successfully ===', {
          ...stats,
          performance: {
            totalProcessingTime: totalTime,
            serviceProcessingTime: serviceTime,
            averagePerImage: serviceTime / results.length,
            imagesPerSecond: (results.length / (serviceTime / 1000)).toFixed(2),
          },
        });

        return res.status(httpStatus.OK).json({
          message: 'Images processed and uploaded successfully',
          data: {
            images: results,
            stats,
          },
        });
      } catch (error) {
        const totalTime = Date.now() - processingStartTime;
        logger.error('=== Image processing failed ===', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          processingTime: totalTime,
          fileCount: files.length,
          totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        });

        // Re-throw the error to be handled by asyncHandler
        throw error;
      }
    },
  );

  /**
   * Process and upload single image
   * POST /api/images/upload-single
   * Content-Type: multipart/form-data
   */
  public processAndUploadSingleImage = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const file = req.file as Express.Multer.File;

      if (!file) {
        throw new BadRequestException('No image provided');
      }

      logger.info('Processing single file:', {
        name: file.originalname,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.mimetype,
      });

      const processRequest: ProcessedImageUploadRequest = {
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileType: file.mimetype,
      };

      const result = await this.s3Service.processAndUploadImage(processRequest);

      return res.status(httpStatus.OK).json({
        message: 'Image processed and uploaded successfully',
        data: result,
      });
    },
  );

  /**
   * Generate presigned URLs for image uploads (LEGACY - for client-side upload)
   * POST /api/images/presigned-urls
   */
  public generatePresignedUrls = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { images }: ImageUploadRequest = req.body;

      // Validate request body
      if (!images || !Array.isArray(images)) {
        throw new BadRequestException('Images array is required');
      }

      // Validate each image request
      for (const [index, image] of images.entries()) {
        if (!image.fileName || !image.fileType || typeof image.fileSize !== 'number') {
          throw new BadRequestException(
            `Invalid image data at index ${index}. fileName, fileType, and fileSize are required`,
          );
        }
      }

      const result = await this.s3Service.generateMultiplePresignedUrls(images);

      return res.status(httpStatus.OK).json({
        message: 'Presigned URLs generated successfully',
        data: result,
        warning: 'Consider using the /upload endpoint for automatic image optimization',
      });
    },
  );

  /**
   * Generate single presigned URL for image upload (LEGACY)
   * POST /api/images/presigned-url
   */
  public generateSinglePresignedUrl = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { fileName, fileType, fileSize } = req.body;

      // Validate request body
      if (!fileName || !fileType || typeof fileSize !== 'number') {
        throw new BadRequestException('fileName, fileType, and fileSize are required');
      }

      const result = await this.s3Service.generatePresignedUrl(fileName, fileType, fileSize);

      return res.status(httpStatus.OK).json({
        message: 'Presigned URL generated successfully',
        data: result,
        warning: 'Consider using the /upload-single endpoint for automatic image optimization',
      });
    },
  );

  /**
   * Get image metadata
   * POST /api/images/metadata
   * Content-Type: multipart/form-data
   */
  public getImageMetadata = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const file = req.file as Express.Multer.File;

    if (!file) {
      throw new BadRequestException('No image provided');
    }

    const metadata = await this.s3Service.getImageMetadata(file.buffer);

    return res.status(httpStatus.OK).json({
      message: 'Image metadata retrieved successfully',
      data: {
        fileName: file.originalname,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        metadata,
      },
    });
  });

  /**
   * Delete uploaded image
   * DELETE /api/images/:key
   */
  public deleteImage = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { key } = req.params;

    if (!key) {
      throw new BadRequestException('Image key is required');
    }

    // Decode the key as it might be URL encoded
    const decodedKey = decodeURIComponent(key);

    await this.s3Service.deleteObject(decodedKey);

    return res.status(httpStatus.OK).json({
      message: 'Image deleted successfully',
    });
  });

  /**
   * Delete multiple uploaded images
   * DELETE /api/images/batch
   */
  public deleteMultipleImages = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const { keys }: { keys: string[] } = req.body;

      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        throw new BadRequestException('Keys array is required and must not be empty');
      }

      // Decode all keys
      const decodedKeys = keys.map((key) => decodeURIComponent(key));

      await this.s3Service.deleteMultipleObjects(decodedKeys);

      return res.status(httpStatus.OK).json({
        message: 'Images deleted successfully',
      });
    },
  );
}

// Middleware function to handle single image upload
export const uploadSingle = (req: Request, res: Response, next: NextFunction) => {
  const uploadHandler = upload.single('image');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadHandler(req, res, (err: any) => {
    if (err) {
      console.error('Single upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(413).json({
          error: 'Upload error',
          message: err.message,
          code: err.code,
        });
      }
      return res.status(400).json({
        error: 'Upload failed',
        message: err.message,
      });
    }
    next();
  });
};

// Middleware function to handle multiple image uploads
export const uploadMultiple = (req: Request, res: Response, next: NextFunction) => {
  const uploadHandler = upload.array('images', 15);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uploadHandler(req, res, (err: any) => {
    if (err) {
      console.error('Multiple upload error:', err);
      if (err instanceof multer.MulterError) {
        return res.status(413).json({
          error: 'Upload error',
          message: err.message,
          code: err.code,
        });
      }
      return res.status(400).json({
        error: 'Upload failed',
        message: err.message,
      });
    }
    next();
  });
};
