import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

// Configure memory storage for file uploads
const storage = multer.memoryStorage();

// File filter for different upload types
const createFileFilter = (allowedMimeTypes: string[]) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  };
};

// Image file filter
const imageFileFilter = createFileFilter([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
]);

// Video file filter
const videoFileFilter = createFileFilter([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska'
]);

// Audio file filter
const audioFileFilter = createFileFilter([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a'
]);

// Combined media filter (for stories)
const mediaFileFilter = createFileFilter([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime'
]);

// Document file filter
const documentFileFilter = createFileFilter([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]);

// Create multer configurations
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export const uploadVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

export const uploadAudio = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

export const uploadMedia = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Default export for backward compatibility
export const upload = uploadMedia;