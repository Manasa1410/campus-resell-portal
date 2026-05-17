import express from "express";
import {
  createChat,
  getUserChats,
  getMessages,
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createChat);
router.get("/", protect, getUserChats);
router.get("/:chatId/messages", protect, getMessages);

export default router;