import express from "express";
import {
  createChat,
  getUserChats,
  getMessages,
  deleteMessage,
  deleteChat,
  uploadChatImage,
  getUnreadCount
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", protect, createChat);
router.get("/", protect, getUserChats);
router.get("/unread-count", protect, getUnreadCount);
router.get("/:chatId/messages", protect, getMessages);
router.delete("/message/:id", protect, deleteMessage);  // single message
router.delete("/:conversationId", protect, deleteChat); // full chat
router.post("/message/upload", protect, upload.single("image"), uploadChatImage);

export default router;
