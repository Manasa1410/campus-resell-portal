import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";

export const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    //
    // 🔗 Join Chat Room
    //
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      console.log(`📥 Joined chat: ${chatId}`);
    });

    //
    // 💬 Send Message
    //
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, text } = data;

        // Save message in DB
        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          text,
        });

        // Populate sender for frontend rendering
        await message.populate("sender", "name email");

        // Update last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text,
        });

        // Emit message to all users in chat room
        io.to(chatId).emit("receiveMessage", message);

      } catch (error) {
        console.error("❌ Socket error:", error.message);
      }
    });

    //
    // � Typing indicator
    //
    socket.on("typing", ({ chatId, senderId, name }) => {
      socket.to(chatId).emit("typing", { senderId, name });
    });

    socket.on("stopTyping", ({ chatId, senderId }) => {
      socket.to(chatId).emit("stopTyping", { senderId });
    });

    //
    // �👁️ Mark Messages as Read
    //
    socket.on("markAsRead", async (chatId) => {
      try {
        await Message.updateMany(
          { chat: chatId, isRead: false },
          { isRead: true }
        );
      } catch (error) {
        console.error("❌ Read error:", error.message);
      }
    });

    //
    // 🔌 Disconnect
    //
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};