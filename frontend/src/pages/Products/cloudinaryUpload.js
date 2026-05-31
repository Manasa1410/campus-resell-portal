import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create a Multer storage engine for Cloudinary
// This function returns a multer instance configured to upload to Cloudinary
const upload = (folderName) => multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folderName, // Specify the folder in your Cloudinary account
      format: async (req, file) => 'webp', // Optimize image format (e.g., webp, jpg, png)
      public_id: (req, file) => `${file.fieldname}-${Date.now()}`, // Generate a unique public_id
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Limit file size to 5MB per file
});

export { cloudinary, upload };