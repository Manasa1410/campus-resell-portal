import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import { saveUploadedImage } from "../config/cloudinaryUpload.js";

// Standardized formatImageUrl function
const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return imagePath;

  if (imagePath.startsWith("http")) return imagePath;
  const configuredBackendUrl = (process.env.BACKEND_URL || "").replace(/\/api\/?$/, "").replace(/\/$/, "");
  const host = req?.get("host") || "localhost:5001";
  const hostUrl = configuredBackendUrl || (req ? `${req.protocol}://${host}` : `http://${host}`);

  // For local files, ensure we don't double-prefix 'uploads/'
  const cleanPath = imagePath.replace(/^.*uploads[/\\]/, "");
  return `${hostUrl}/uploads/${cleanPath}`;
};

const formatImages = (req, images = []) => {
  return images.map((image) => formatImageUrl(req, image));
};

//
// 💬 Create or Get Chat
//
export const createChat = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const currentUser = req.user.id;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [currentUser, userId] },
      product: productId,
    }).populate("participants", "name email avatar").populate("product", "title price images");

    if (chat) {
      const chatObj = chat.toObject();
      if (chatObj.product && chatObj.product.images) {
        chatObj.product.images = formatImages(req, chatObj.product.images);
      }
      return res.json({
        success: true,
        chat: chatObj,
      });
    }

    // Create new chat
    chat = await Chat.create({
      participants: [currentUser, userId],
      product: productId,
    });

    const populatedChat = await Chat.findById(chat._id).populate("participants", "name email avatar").populate("product", "title price images");
    const chatObj = populatedChat.toObject();
    if (chatObj.product && chatObj.product.images) {
      chatObj.product.images = formatImages(req, chatObj.product.images);
    }

    res.status(201).json({
      success: true,
      chat: chatObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📥 Get all chats for logged-in user
//
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({
      participants: userId,
    })
    .populate("participants", "name email avatar")
    .populate("product", "title price images")
    .sort({ updatedAt: -1 })
    .lean();
      
    // Calculate unread message count for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: userId }, // Not sent by current user
          readBy: { $ne: userId }, // Not read by current user
        });

        if (chat.product && chat.product.images) {
          chat.product.images = formatImages(req, chat.product.images);
        }

        return { ...chat, unreadCount };
      })
    );

    res.json({
      success: true,
      chats: chatsWithUnreadCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
// 📜 Get messages of a chat
//
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ 
      chat: chatId,
      deletedFor: { $ne: req.user.id } // Exclude messages deleted "for me"
    })
      .populate("sender", "name email")
      .populate("sharedProduct", "title price images")
      .sort({ createdAt: 1 });

    // Mark messages as "seen" for the current user
    await Message.updateMany(
      { chat: chatId, status: { $ne: 'seen' }, sender: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id }, $set: { status: 'seen' } }
    );

    // Filter out messages marked as deleted for everyone, or for the current user
    const filteredMessages = messages.filter(msg => !msg.isDeletedForEveryone && !msg.deletedFor.includes(req.user.id));

    res.json({
      success: true,
      messages: filteredMessages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


//delete single message
export const deleteMessage = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { id: messageId } = req.params;
    const { deleteType } = req.body; // 'forMe' or 'forEveryone'

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // only sender can delete
    const currentUserId = req.user.id || req.user._id;
    if (!message.sender || message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (deleteType === 'forEveryone') {
      await Message.findByIdAndUpdate(messageId, {
        $set: { isDeletedForEveryone: true, text: "[Message deleted]" }
      });
      return res.json({ success: true, message: "Message deleted for everyone" });
    } else if (deleteType === 'forMe') {
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { deletedFor: currentUserId }
      });
      return res.json({ success: true, message: "Message deleted for you" });
    } else {
      return res.status(400).json({ message: "Invalid delete type" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//delete entire chat
export const deleteChat = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });

    const { conversationId } = req.params;
    const currentUserId = req.user.id || req.user._id;

    const chat = await Chat.findById(conversationId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Check if user is participant
    if (!chat.participants.some(p => p.toString() === currentUserId?.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 1. Permanently clear all messages associated with this chat
    await Message.deleteMany({ chat: conversationId });

    // 2. Permanently remove the chat document itself
    await Chat.findByIdAndDelete(conversationId);

    res.json({ success: true, message: "Chat and all messages permanently removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// 🔢 Get Total Unread Message Count for Navbar
//
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Message.countDocuments({
      sender: { $ne: userId },   // Not sent by me
      readBy: { $ne: userId },   // Not read by me
    });

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📷 Upload Image for Chat Message
export const uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    // Upload to Cloudinary and cleanup local temp file
    const fileUrl = await saveUploadedImage(req.file, "campus_resell/chat");

    res.json({
      success: true,
      fileUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
