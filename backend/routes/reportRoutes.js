import express from "express";
import {
  createReport,
  getReports,
  updateReportStatus,
  banUser,
  unbanUser,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, createReport);
router.get("/", protect, isAdmin, getReports);
router.put("/:id", protect, isAdmin, updateReportStatus);
router.put("/ban/:userId", protect, isAdmin, banUser);
router.put("/unban/:userId", protect, isAdmin, unbanUser);

export default router;