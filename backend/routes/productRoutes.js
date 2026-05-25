import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  markAsSold,
  getMyProducts,
  updateProductStatus,
  toggleWishlist,
  createProductReview,
  getWishlistProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({ storage });

router.post("/", protect, upload.array("images", 5), createProduct);
router.get("/", getProducts);
router.get("/my-products", protect, getMyProducts);
router.get("/wishlist", protect, getWishlistProducts);
router.get("/:id", getProductById);
router.put("/:id", protect, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, deleteProduct);
router.put("/:id/sold", protect, markAsSold);
router.put("/:id/status", protect, updateProductStatus);
router.post("/:id/reviews", protect, createProductReview);
router.post("/:id/wishlist", protect, toggleWishlist);

export default router;