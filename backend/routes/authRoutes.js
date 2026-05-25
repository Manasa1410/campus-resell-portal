import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateAvatar,
  updateProfile,
  updatePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/profile", protect, updateProfile);
router.put("/password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;