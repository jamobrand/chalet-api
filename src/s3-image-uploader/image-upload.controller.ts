import { Request, Response } from 'express';
import httpStatus from 'http-status';
import multer from 'multer';
import { BadRequestException } from '../common/utils/catch-errors';
import { asyncHandler } from '../common/utils/asyncHandler';
import { ImageUploadRequest, ProcessedImageUploadRequest, S3Service } from './s3.service';

// Configure multer for memory storage (we'll process images in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for original uploads
    files: 10, // Maximum 10 files
  },
  fileFilter: (_req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
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
   * Get multer middleware for handling multipart uploads
   */
  public getUploadMiddleware() {
    return upload.array('images', 10); // Allow up to 10 images
  }

  /**
   * Process and upload images directly (RECOMMENDED)
   * POST /api/images/upload
   * Content-Type: multipart/form-data
   */
  public processAndUploadImages = asyncHandler(
    async (req: Request, res: Response): Promise<Response> => {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new BadRequestException('No images provided');
      }

      if (files.length > 10) {
        throw new BadRequestException('Maximum 10 images allowed per upload');
      }

      // Prepare requests for processing
      const processRequests: ProcessedImageUploadRequest[] = files.map((file) => ({
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileType: file.mimetype,
      }));

      const results = await this.s3Service.processAndUploadMultipleImages(processRequests);

      // Calculate total compression stats
      const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
      const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
      const overallCompressionRatio = ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(
        2,
      );

      return res.status(httpStatus.OK).json({
        message: 'Images processed and uploaded successfully',
        data: {
          images: results,
          stats: {
            totalImages: results.length,
            totalOriginalSize: `${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`,
            totalCompressedSize: `${(totalCompressedSize / 1024 / 1024).toFixed(2)}MB`,
            overallCompressionRatio: `${overallCompressionRatio}%`,
            spaceSaved: `${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)}MB`,
          },
        },
      });
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
export const uploadSingle = upload.single('image');

// Middleware function to handle multiple image uploads
export const uploadMultiple = upload.array('images', 10);
