import express from "express";
import {
  createChat,
  getUserChats,
  getMessages,
  deleteMessage,
  deleteChat
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createChat);
router.get("/", protect, getUserChats);
router.get("/:chatId/messages", protect, getMessages);
router.delete("/message/:id", protect, deleteMessage);  // single message
router.delete("/:conversationId", protect, deleteChat); // full chat

export default router;