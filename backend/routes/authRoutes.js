import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateAvatar,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  requestEmailVerification,
  confirmEmailVerification,
  sendOtp,
  verifyOtp,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.put("/reset-password/:token", resetPassword);
router.post("/send-otp", protect, requestEmailVerification);
router.post("/verify-otp", protect, confirmEmailVerification);

export default router;
