import express from "express";
import { createSellerReview, getSellerReviews } from "../controllers/sellerReviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:sellerId", protect, createSellerReview);
router.get("/:sellerId", getSellerReviews);

export default router;
