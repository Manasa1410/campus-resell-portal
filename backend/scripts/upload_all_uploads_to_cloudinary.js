import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { uploadFileToCloudinary, isCloudinaryConfigured } from '../config/cloudinaryUpload.js';

const uploadsDir = path.join(__dirname, '..', 'uploads');
const outDir = path.join(__dirname, '..', 'migration-logs');

const run = async () => {
  if (!isCloudinaryConfigured()) {
    console.error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env and retry.');
    process.exit(1);
  }

  await fs.promises.mkdir(outDir, { recursive: true });

  const files = await fs.promises.readdir(uploadsDir).catch(() => []);
  console.log(`Found ${files.length} files in uploads to upload.`);

  const results = [];

  for (const f of files) {
    const localPath = path.join(uploadsDir, f);
    try {
      console.log(`[upload] Uploading ${localPath} ...`);
      const res = await uploadFileToCloudinary(localPath, 'campus_resell/products');
      const secure = res?.secure_url || res?.url;
      if (secure) {
        results.push({ file: f, path: localPath, url: secure });
        console.log(`[ok] Uploaded ${f} -> ${secure}`);
      } else {
        results.push({ file: f, path: localPath, url: null, error: 'no url returned' });
        console.warn(`[warn] No URL for ${f}`);
      }
    } catch (err) {
      results.push({ file: f, path: localPath, url: null, error: err.message });
      console.error(`[error] Failed to upload ${f}: ${err.message}`);
    }
  }

  const outFile = path.join(outDir, `uploads_mapping_${Date.now()}.json`);
  await fs.promises.writeFile(outFile, JSON.stringify(results, null, 2));
  console.log(`Upload mapping saved: ${outFile}`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Upload script failed:', err.message);
  process.exit(1);
});
