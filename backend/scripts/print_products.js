import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import connectDB from '../config/db.js';
import Product from '../models/productModel.js';

try {
  await connectDB();
  const docs = await Product.find({}, 'title images').limit(5).lean();
  console.log('\n--- Recent 5 Products ---\n');
  console.log(JSON.stringify(docs, null, 2));
  process.exit(0);
} catch (err) {
  console.error('Error fetching products:', err.message);
  process.exit(1);
}
