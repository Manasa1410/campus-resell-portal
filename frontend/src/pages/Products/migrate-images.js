// This script should be run once from your backend environment.
// Make sure your MongoDB connection and Cloudinary configuration are accessible.

import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { cloudinary } from './backend/config/cloudinaryUpload.js'; // Adjust path as needed
import User from './backend/models/userModel.js'; // Adjust path as needed
import Product from './backend/models/productModel.js'; // Adjust path as needed
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust this path to your local uploads folder
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, 'backend', 'uploads'); // Assuming 'uploads' is in the backend directory

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrateImages = async () => {
  await connectDB();

  console.log('Starting image migration...');

  // Migrate User Avatars
  const users = await User.find({ avatar: { $regex: /^\/uploads\// } });
  for (const user of users) {
    const localPath = path.join(LOCAL_UPLOADS_DIR, user.avatar.replace('/uploads/', ''));
    try {
      // Check if file exists locally before attempting upload
      await fs.access(localPath);

      console.log(`Migrating user avatar: ${user.avatar} for user ${user.email}`);
      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'campus_resell/avatars',
        format: 'webp',
        public_id: `avatar-${user._id}-${Date.now()}`,
      });
      user.avatar = result.secure_url;
      await user.save();
      console.log(`Updated user ${user.email} with new avatar: ${user.avatar}`);

      // Optional: Delete local file after successful upload and DB update
      // await fs.unlink(localPath);
      // console.log(`Deleted local file: ${localPath}`);

    } catch (error) {
      console.warn(`Could not migrate avatar for user ${user.email} from ${localPath}: ${error.message}`);
      // Optionally set to default avatar or null if local file is missing
      user.avatar = ''; // Or a default Cloudinary URL
      await user.save();
    }
  }

  // Migrate Product Images
  const products = await Product.find({ images: { $elemMatch: { $regex: /^\/uploads\// } } });
  for (const product of products) {
    const newImageUrls = [];
    for (const imageUrl of product.images) {
      if (imageUrl.startsWith('/uploads/')) {
        const localPath = path.join(LOCAL_UPLOADS_DIR, imageUrl.replace('/uploads/', ''));
        try {
          await fs.access(localPath);

          console.log(`Migrating product image: ${imageUrl} for product ${product.title}`);
          const result = await cloudinary.uploader.upload(localPath, {
            folder: 'campus_resell/products',
            format: 'webp',
            public_id: `product-${product._id}-${Date.now()}`,
          });
          newImageUrls.push(result.secure_url);
          console.log(`Updated product ${product.title} with new image: ${result.secure_url}`);

          // Optional: Delete local file
          // await fs.unlink(localPath);
          // console.log(`Deleted local file: ${localPath}`);

        } catch (error) {
          console.warn(`Could not migrate image ${imageUrl} for product ${product.title} from ${localPath}: ${error.message}`);
          // Keep old URL or replace with default if local file is missing
          newImageUrls.push(''); // Or a default Cloudinary URL
        }
      } else {
        newImageUrls.push(imageUrl); // Keep existing Cloudinary URLs or other absolute URLs
      }
    }
    product.images = newImageUrls.filter(url => url); // Filter out empty strings if any failed
    await product.save();
  }

  console.log('Image migration complete.');
  mongoose.disconnect();
};

migrateImages();