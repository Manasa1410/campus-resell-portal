import express from "express";
import {
  createProduct,
  getProducts,
  getProductSuggestions,
  getRecommendedProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleFeaturedProduct,
  markAsSold,
  getMyProducts,
  updateProductStatus,
  toggleWishlist,
  createProductReview,
  getWishlistProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, upload.array("images", 5), createProduct);
router.get("/", getProducts);
router.get("/suggestions", getProductSuggestions);
router.get("/recommended", getRecommendedProducts);
router.get("/my-products", protect, getMyProducts);
router.get("/wishlist", protect, getWishlistProducts);
router.put("/:id/featured", protect, toggleFeaturedProduct);
router.get("/:id", getProductById);
router.put("/:id", protect, upload.array("images", 5), updateProduct);
router.delete("/:id", protect, deleteProduct);
router.put("/:id/sold", protect, markAsSold);
router.put("/:id/status", protect, updateProductStatus);
router.post("/:id/reviews", protect, createProductReview);
router.post("/:id/wishlist", protect, toggleWishlist);

export default router;
