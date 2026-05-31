import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from '../config/db.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

const migrationDir = path.join(__dirname, '..', 'migration-logs');

const findLatestMapping = async () => {
  const files = await fs.promises.readdir(migrationDir).catch(() => []);
  const matches = files.filter(f => f.startsWith('uploads_mapping_') && f.endsWith('.json'));
  if (matches.length === 0) return null;
  matches.sort();
  return path.join(migrationDir, matches[matches.length - 1]);
};

const basename = (p) => path.basename(p).replace(/^\/+/, '');

const run = async () => {
  const mappingFile = await findLatestMapping();
  if (!mappingFile) {
    console.error('No uploads mapping file found in migration-logs. Run upload_all_uploads_to_cloudinary.js first.');
    process.exit(1);
  }

  const raw = await fs.promises.readFile(mappingFile, 'utf8');
  const entries = JSON.parse(raw);
  const map = {};
  for (const e of entries) {
    const name = e.file || basename(e.path || '');
    if (name) map[name] = e.url || null;
  }

  console.log(`Loaded ${Object.keys(map).length} mapping entries from ${mappingFile}`);

  await connectDB();

  let productsUpdated = 0;
  let usersUpdated = 0;
  const productDocs = await Product.find({}).lean();

  for (const p of productDocs) {
    const images = Array.isArray(p.images) ? p.images : [];
    let changed = false;
    const newImages = images.map(img => {
      if (!img) return img;
      if (img.startsWith('http')) return img;
      const name = basename(img);
      if (map[name]) {
        changed = true;
        return map[name];
      }
      return img;
    });

    if (changed) {
      await Product.findByIdAndUpdate(p._id, { images: newImages });
      productsUpdated++;
      console.log(`[product] Updated ${p._id}: ${images.length} images`);
    }
  }

  const users = await User.find({}).lean();
  for (const u of users) {
    if (!u.avatar) continue;
    if (u.avatar.startsWith('http')) continue;
    const name = basename(u.avatar);
    if (map[name]) {
      await User.findByIdAndUpdate(u._id, { avatar: map[name] });
      usersUpdated++;
      console.log(`[user] Updated avatar for user ${u._id}`);
    }
  }

  const out = {
    mappingFile,
    productsUpdated,
    usersUpdated,
    timestamp: Date.now(),
  };

  const outFile = path.join(migrationDir, `apply_mapping_result_${Date.now()}.json`);
  await fs.promises.writeFile(outFile, JSON.stringify(out, null, 2));
  console.log(`
Done. Products updated: ${productsUpdated}, Users updated: ${usersUpdated}. Result: ${outFile}`);
  process.exit(0);
};

run().catch(err => {
  console.error('Failed to apply mapping:', err.message);
  process.exit(1);
});
