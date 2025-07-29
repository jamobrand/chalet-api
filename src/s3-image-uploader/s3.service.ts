import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { config } from '../config/app.config';
import { BadRequestException } from '../common/utils/catch-errors';
import { logger } from '../common/utils/logger';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
}

export interface ImageUploadRequest {
  images: PresignedUrlRequest[];
}

export interface ImageUploadResponse {
  uploadUrls: PresignedUrlResponse[];
}

export interface ProcessedImageUploadRequest {
  fileName: string;
  fileBuffer: Buffer;
  fileType: string;
}

export interface ProcessedImageUploadResponse {
  key: string;
  publicUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;
  private cloudFrontDomain?: string;

  // Allowed file types and size limits
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB (increased for original uploads)
  private readonly PRESIGNED_URL_EXPIRY = 300; // 5 minutes

  // Image processing configurations
  private readonly DEFAULT_PROCESSING_OPTIONS: ImageProcessingOptions = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'jpeg',
    progressive: true,
  };

  private readonly THUMBNAIL_OPTIONS: ImageProcessingOptions = {
    maxWidth: 400,
    maxHeight: 400,
    quality: 80,
    format: 'jpeg',
    progressive: true,
  };

  constructor() {
    this.bucketName = config.AWS_S3_BUCKET!;
    this.region = config.AWS_REGION!;
    this.cloudFrontDomain = config.CLOUDFRONT_DOMAIN || '';

    if (!this.bucketName || !this.region) {
      throw new Error('AWS S3 configuration is missing');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID!,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Validates file before generating presigned URL
   */
  private validateFile(fileName: string, fileType: string, fileSize: number): void {
    // Check file type
    if (!this.ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
      throw new BadRequestException(
        `File type ${fileType} is not allowed. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Check file size
    if (fileSize > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }

    // Check file name
    if (!fileName || fileName.length > 255) {
      throw new BadRequestException('Invalid file name');
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      throw new BadRequestException('File type not allowed for security reasons');
    }
  }

  /**
   * Generates a secure S3 key for the file
   */
  private generateS3Key(fileName: string, suffix: string = ''): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const nameWithoutExt =
      sanitizedFileName.substring(0, sanitizedFileName.lastIndexOf('.')) || sanitizedFileName;
    const extension = suffix
      ? '.jpg'
      : sanitizedFileName.substring(sanitizedFileName.lastIndexOf('.'));

    return `chalet-images/${timestamp}-${uuid}-${nameWithoutExt}${suffix}${extension}`;
  }

  /**
   * Generates public URL for the uploaded file
   */
  private generatePublicUrl(key: string): string {
    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${key}`;
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Process image with Sharp - resize, compress, and optimize
   */
  private async processImage(
    imageBuffer: Buffer,
    options: ImageProcessingOptions = this.DEFAULT_PROCESSING_OPTIONS,
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(imageBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(options.maxWidth, options.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });

      // Apply format-specific optimizations
      switch (options.format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive || true,
            mozjpeg: true, // Use mozjpeg encoder for better compression
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: options.quality || 85,
            progressive: options.progressive || true,
            compressionLevel: 9,
          });
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({
            quality: options.quality || 85,
            effort: 6, // Higher effort for better compression
          });
          break;
        default:
          sharpInstance = sharpInstance.jpeg({
            quality: options.quality || 85,
            progressive: options.progressive || true,
            mozjpeg: true,
          });
      }

      return await sharpInstance.toBuffer();
    } catch (error) {
      logger.error('Error processing image with Sharp:', error);
      throw new BadRequestException('Failed to process image');
    }
  }

  /**
   * Upload processed image buffer directly to S3
   */
  private async uploadImageBuffer(
    imageBuffer: Buffer,
    key: string,
    contentType: string = 'image/jpeg',
  ): Promise<void> {
    try {
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
        ContentLength: imageBuffer.length,
        Metadata: {
          'uploaded-by': 'chalet-system',
          'upload-timestamp': new Date().toISOString(),
          processed: 'true',
        },
        ServerSideEncryption: 'AES256',
        ChecksumAlgorithm: 'SHA256',
      });

      await this.s3Client.send(putObjectCommand);
    } catch (error) {
      logger.error('Error uploading image to S3:', error);
      throw new BadRequestException('Failed to upload processed image');
    }
  }

  /**
   * Process and upload image directly (recommended for production)
   */
  public async processAndUploadImage(
    request: ProcessedImageUploadRequest,
  ): Promise<ProcessedImageUploadResponse> {
    const { fileName, fileBuffer, fileType } = request;

    // Validate the original file
    this.validateFile(fileName, fileType, fileBuffer.length);

    const originalSize = fileBuffer.length;

    try {
      // Process main image
      const processedBuffer = await this.processImage(fileBuffer);
      const mainKey = this.generateS3Key(fileName);

      // Process thumbnail
      const thumbnailBuffer = await this.processImage(fileBuffer, this.THUMBNAIL_OPTIONS);
      const thumbnailKey = this.generateS3Key(fileName, '-thumb');

      // Upload both images
      await Promise.all([
        this.uploadImageBuffer(processedBuffer, mainKey, 'image/jpeg'),
        this.uploadImageBuffer(thumbnailBuffer, thumbnailKey, 'image/jpeg'),
      ]);

      const compressedSize = processedBuffer.length;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2);

      logger.info(`Image processed: ${fileName}`, {
        originalSize: `${(originalSize / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
        compressionRatio: `${compressionRatio}%`,
      });

      return {
        key: mainKey,
        publicUrl: this.generatePublicUrl(mainKey),
        originalSize,
        compressedSize,
        compressionRatio: `${compressionRatio}%`,
      };
    } catch (error) {
      logger.error('Error in processAndUploadImage:', error);
      throw error;
    }
  }

  /**
   * Process and upload multiple images
   */
  public async processAndUploadMultipleImages(
    requests: ProcessedImageUploadRequest[],
  ): Promise<ProcessedImageUploadResponse[]> {
    // Validate number of images (updated to 10)
    if (requests.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (requests.length > 15) {
      throw new BadRequestException('Maximum 15 images allowed per upload');
    }

    const results: ProcessedImageUploadResponse[] = [];

    try {
      // Process images concurrently but with a limit to avoid overwhelming the system
      const concurrencyLimit = 3;
      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        const batch = requests.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(
          batch.map((request) => this.processAndUploadImage(request)),
        );
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      logger.error('Error processing multiple images:', error);
      throw error;
    }
  }

  /**
   * Generates presigned URL for single file upload (legacy method)
   */
  public async generatePresignedUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
  ): Promise<PresignedUrlResponse> {
    // Validate the file
    this.validateFile(fileName, fileType, fileSize);

    // Generate unique S3 key
    const key = this.generateS3Key(fileName);

    // Create the PutObject command with additional security parameters
    const putObjectCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'uploaded-by': 'chalet-system',
        'upload-timestamp': new Date().toISOString(),
      },
      // Add additional security headers
      ServerSideEncryption: 'AES256',
      // Optionally add checksum for integrity
      ChecksumAlgorithm: 'SHA256',
    });

    try {
      // Generate presigned URL
      const presignedUrl = await getSignedUrl(this.s3Client, putObjectCommand, {
        expiresIn: this.PRESIGNED_URL_EXPIRY,
      });

      // Generate public URL for accessing the file after upload
      const publicUrl = this.generatePublicUrl(key);

      return {
        presignedUrl,
        key,
        publicUrl,
      };
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new BadRequestException('Failed to generate upload URL');
    }
  }

  /**
   * Generates presigned URLs for multiple files (legacy method)
   */
  public async generateMultiplePresignedUrls(
    images: PresignedUrlRequest[],
  ): Promise<ImageUploadResponse> {
    // Validate number of images
    if (images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (images.length > 15) {
      throw new BadRequestException('Maximum 15 images allowed per upload');
    }

    const uploadUrls: PresignedUrlResponse[] = [];

    try {
      // Generate presigned URLs for all images
      for (const image of images) {
        const urlData = await this.generatePresignedUrl(
          image.fileName,
          image.fileType,
          image.fileSize,
        );
        uploadUrls.push(urlData);
      }

      return { uploadUrls };
    } catch (error) {
      console.error('Error generating multiple presigned URLs:', error);
      throw error; // Re-throw to maintain error context
    }
  }

  /**
   * Deletes an object from S3
   */
  public async deleteObject(key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting S3 object:', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  /**
   * Batch delete multiple objects
   */
  public async deleteMultipleObjects(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteObject(key));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting multiple S3 objects:', error);
      throw new BadRequestException('Failed to delete images');
    }
  }

  /**
   * Get image metadata without downloading the full image
   */
  public async getImageMetadata(imageBuffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(imageBuffer).metadata();
    } catch (error) {
      logger.error('Error getting image metadata:', error);
      throw new BadRequestException('Failed to get image metadata');
    }
  }
}
