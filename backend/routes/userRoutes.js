import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import { updateAvatar } from "../controllers/authController.js";
import { getAdminStats, getAllUsers, toggleBanUser } from "../controllers/userController.js";

const router = express.Router();

// 👤 Update profile image
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

// 🛡️ Admin Routes
router.get("/admin/stats", protect, isAdmin, getAdminStats);
router.get("/admin/all", protect, isAdmin, getAllUsers);
router.put("/admin/ban/:id", protect, isAdmin, toggleBanUser);

export default router;