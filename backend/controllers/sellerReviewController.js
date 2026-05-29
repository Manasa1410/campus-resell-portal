import SellerReview from "../models/sellerReviewModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { getIO } from "../config/socket.js";

// ⭐ Create a review for a seller
export const createSellerReview = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { rating, comment } = req.body;
    const reviewerId = req.user.id || req.user._id;

    // 1. Check if rating themselves
    if (sellerId.toString() === reviewerId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot rate yourself",
      });
    }

    // 2. Check if seller exists
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // 3. Check for existing review
    const existingReview = await SellerReview.findOne({
      seller: sellerId,
      reviewer: reviewerId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already left a review for this seller",
      });
    }

    // 4. Create review
    const review = await SellerReview.create({
      seller: sellerId,
      reviewer: reviewerId,
      rating: Number(rating),
      comment,
    });

    // 5. Populate reviewer name
    const populatedReview = await review.populate("reviewer", "name avatar");

    // 6. Recalculate stats for the seller
    const reviews = await SellerReview.find({ seller: sellerId });
    const totalReviews = reviews.length;
    const averageRating = Number(
      (reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews).toFixed(1)
    );

    // Update User document
    seller.averageRating = averageRating;
    seller.totalReviews = totalReviews;
    await seller.save();

    // 7. Create database notification for the seller
    const notification = await Notification.create({
      recipient: sellerId,
      sender: reviewerId,
      type: "review",
      message: `${req.user.name} rated you ${rating} stars: "${comment}"`,
    });

    // Emit live notification via Socket
    const io = getIO();
    if (io) {
      io.to(sellerId.toString()).emit("newNotification", notification);
    }

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: populatedReview,
      sellerStats: {
        averageRating,
        totalReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📥 Get all reviews for a seller
export const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const reviews = await SellerReview.find({ seller: sellerId })
      .populate("reviewer", "name avatar isVerified")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
