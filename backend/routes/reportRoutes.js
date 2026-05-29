import express from "express";
import {
  createReport,
  getReports,
  updateReportStatus,
  banUser,
  unbanUser,
  deleteReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, createReport);
router.get("/admin/all", protect, isAdmin, getReports);
router.put("/status/:id", protect, isAdmin, updateReportStatus);
router.put("/ban/:userId", protect, isAdmin, banUser);
router.put("/unban/:userId", protect, isAdmin, unbanUser);
router.delete("/admin/:id", protect, isAdmin, deleteReport);

export default router;