import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

//
// 💬 Create or Get Chat
//
export const createOrGetChat = async (currentUserId, userId, productId) => {
  // Check existing chat
  let chat = await Chat.findOne({
    participants: { $all: [currentUserId, userId] },
    product: productId,
  });

  if (chat) return chat;

  // Create new chat
  chat = await Chat.create({
    participants: [currentUserId, userId],
    product: productId,
  });

  return chat;
};

//
// 📥 Get User Chats
//
export const getChatsByUser = async (userId) => {
  const chats = await Chat.find({
    participants: userId,
  })
    .populate("participants", "name email avatar")
    .populate("product", "title price images")
    .sort({ updatedAt: -1 });

  return chats;
};

//
// 📤 Send Message
//
export const sendMessageService = async (chatId, senderId, text) => {
  const message = await Message.create({
    chat: chatId,
    sender: senderId,
    text,
  });

  // Update last message in chat
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: text,
  });

  return message;
};

//
// 📜 Get Messages
//
export const getMessagesByChat = async (chatId) => {
  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name email")
    .sort({ createdAt: 1 });

  return messages;
};