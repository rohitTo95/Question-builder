import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export interface CloudinaryUploadOptions {
  userId: string;
  formId: string;
  imageType: 'header' | 'question';
  questionId?: string;
}

export const uploadToCloudinary = async (
  buffer: Buffer,
  options: CloudinaryUploadOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { userId, formId, imageType, questionId } = options;
    
    // Determine folder path based on image type
    let folder: string;
    let public_id: string;
    
    if (imageType === 'header') {
      folder = `${userId}/forms/${formId}/header-img`;
      public_id = 'header_img';
    } else {
      folder = `${userId}/forms/${formId}/body/question-${questionId}`;
      public_id = 'image';
    }

    const uploadOptions = {
      folder,
      public_id,
      resource_type: 'image' as const,
      format: 'webp', // Convert to WebP for optimization
      transformation: [
        {
          width: 1200,
          crop: 'limit', // Don't upscale, only downscale if larger
          quality: 'auto:good',
        }
      ],
      overwrite: true, // Allow overwriting existing images
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      })
      .end(buffer);
  });
};

export const deleteFromCloudinary = async (
  userId: string,
  formId: string,
  imageType: 'header' | 'question',
  questionId?: string
): Promise<void> => {
  try {
    let public_id: string;
    
    if (imageType === 'header') {
      public_id = `${userId}/forms/${formId}/header-img/header_img`;
    } else {
      public_id = `${userId}/forms/${formId}/body/question-${questionId}/image`;
    }

    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error to prevent blocking other operations
  }
};

export default cloudinary;
