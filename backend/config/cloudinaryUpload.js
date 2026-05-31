import cloudinary from "./cloudinary.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from 'multer'; // Import multer
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

const sanitizeFileName = (name = "upload") =>
  path.basename(name).replace(/[^a-z0-9._-]/gi, "_");

// Configure multer to store files in memory
const memoryStorage = multer.memoryStorage();
// Export the multer instance as 'upload' middleware
export const upload = multer({ storage: memoryStorage });

const saveBufferLocally = async (file) => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const originalName = sanitizeFileName(file.originalname);
  const extension = path.extname(originalName) || ".jpg";
  const baseName = path.basename(originalName, extension) || "image";
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${baseName}${extension}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, file.buffer);
  return `uploads/${fileName}`;
};

export const isCloudinaryConfigured = () =>
  Boolean(
    (process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME) &&
      (process.env.CLOUDINARY_API_KEY || process.env.API_KEY) &&
      (process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET)
  );

/**
 * Uploads a buffer to Cloudinary (useful for memory storage).
 */
export const uploadToCloudinary = (buffer, folder = "blog_users") => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
        )
      );
    }

    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
};

/**
 * Uploads a file from a local path to Cloudinary and ensures local cleanup.
 */
export const uploadFileToCloudinary = async (filePath, folder = "general") => {
  try {
    if (!filePath) throw new Error("No file path provided to Cloudinary helper");
    if (!isCloudinaryConfigured()) {
      throw new Error(
        "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
      );
    }
    const result = await cloudinary.uploader.upload(filePath, { folder, resource_type: "auto" });
    return result;
  } catch (error) {
    console.error(`[Cloudinary Upload Error]: ${error.message}`);
    throw error;
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const saveUploadedImage = async (file, folder = "general") => {
  if (!file?.buffer && !file?.path) {
    throw new Error("No uploaded file received");
  }
  // Prefer Cloudinary when configured
  if (file.buffer) {
    if (isCloudinaryConfigured()) {
      try {
        console.log(`[upload] Cloudinary configured - uploading buffer to folder=${folder}`);
        const result = await uploadToCloudinary(file.buffer, folder);
        console.log(`[upload] Cloudinary upload succeeded: ${result.secure_url}`);
        return result.secure_url;
      } catch (error) {
        console.error(`[Cloudinary Upload Error] Falling back to local upload: ${error.message}`);
      }
    }

    const local = await saveBufferLocally(file);
    console.log(`[upload] Saved buffer locally: ${local}`);
    return local;
  }

  if (file.path) {
    if (isCloudinaryConfigured()) {
      try {
        console.log(`[upload] Cloudinary configured - uploading file path ${file.path} to folder=${folder}`);
        const result = await cloudinary.uploader.upload(file.path, { folder, resource_type: "auto" });
        await fs.promises.unlink(file.path).catch(() => {});
        console.log(`[upload] Cloudinary upload succeeded: ${result.secure_url}`);
        return result.secure_url;
      } catch (error) {
        console.error(`[Cloudinary Upload Error] Local file upload failed: ${error.message}`);
      }
    }

    const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${sanitizeFileName(file.originalname || path.basename(file.path))}`;
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const destination = path.join(uploadsDir, fileName);
    await fs.promises.copyFile(file.path, destination);
    await fs.promises.unlink(file.path).catch(() => {});
    const localPath = `uploads/${fileName}`;
    console.log(`[upload] Saved file locally: ${localPath}`);
    return localPath;
  }
};
