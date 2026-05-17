import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

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
    });

    if (chat) {
      return res.json({
        success: true,
        chat,
      });
    }

    // Create new chat
    chat = await Chat.create({
      participants: [currentUser, userId],
      product: productId,
    });

    res.status(201).json({
      success: true,
      chat,
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
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      chats,
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

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};