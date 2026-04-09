import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerDiskStorage = diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    callback(null, filename);
  },
});

export const multerFileFilter = (req, file, callback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new Error('Only documents and images are allowed!'), false);
  }
  callback(null, true);
};

export const multerLimits = {
  fileSize: 1024 * 1024 * 10, // 10MB limit
};
