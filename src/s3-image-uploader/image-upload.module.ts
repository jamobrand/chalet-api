import { ImageUploadController } from './image-upload.controller';
import { S3Service } from './s3.service';

// Initialize services
const s3Service = new S3Service();

// Initialize controllers
const imageUploadController = new ImageUploadController(s3Service);

export { imageUploadController, s3Service };
