import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from '../config/db.js';
import Product from '../models/productModel.js';
import { uploadFileToCloudinary, isCloudinaryConfigured } from '../config/cloudinaryUpload.js';

const uploadsDir = path.join(__dirname, '..', 'uploads');

const results = [];

const run = async () => {
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env and retry.');
    process.exit(1);
  }

  await connectDB();
  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} products; scanning for local upload paths...`);

  // Build a map of existing upload files by basename for fuzzy matching
  const diskFiles = await fs.promises.readdir(uploadsDir).catch(() => []);
  const fileMap = {};
  for (const f of diskFiles) {
    fileMap[path.basename(f)] = path.join(uploadsDir, f);
  }

  for (const p of products) {
    const images = Array.isArray(p.images) ? p.images : [];
    const updatedImages = [...images];
    let changed = false;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img) continue;
      if (img.startsWith('http')) continue; // already remote

      const basename = path.basename(img.replace(/^\/+/, ''));
      const localPath = fileMap[basename];

      if (!localPath) {
        console.warn(`[skip] No matching local file for product ${p._id} image basename=${basename}`);
        continue;
      }

      try {
        console.log(`[upload] Uploading ${localPath} for product ${p._id}...`);
        const res = await uploadFileToCloudinary(localPath, 'campus_resell/products');
        const secure = res?.secure_url || res?.url;
        if (secure) {
          updatedImages[i] = secure;
          changed = true;
          results.push({ productId: p._id, from: img, to: secure, file: localPath });
          console.log(`[ok] Uploaded and updated: ${img} -> ${secure}`);
        } else {
          console.warn(`[warn] Upload returned no secure url for ${localPath}`);
        }
      } catch (err) {
        console.error(`[error] Upload failed for ${localPath}: ${err.message}`);
      }
    }

    if (changed) {
      await Product.findByIdAndUpdate(p._id, { images: updatedImages });
      console.log(`[save] Updated product ${p._id} images`);
    }
  }

  // Save migration log
  const logDir = path.join(__dirname, '..', 'migration-logs');
  await fs.promises.mkdir(logDir, { recursive: true });
  const outFile = path.join(logDir, `migrate_uploads_${Date.now()}.json`);
  await fs.promises.writeFile(outFile, JSON.stringify(results, null, 2));

  console.log(`Migration complete. ${results.length} images migrated. Log: ${outFile}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
