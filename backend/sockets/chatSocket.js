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

        // Mark message as delivered to all participants except sender
        const chat = await Chat.findById(chatId);
        if (chat) {
          const otherParticipants = chat.participants.filter(p => p.toString() !== senderId.toString());
          await Message.findByIdAndUpdate(message._id, {
            $set: { status: 'delivered' },
            $addToSet: { readBy: senderId } // Sender has "read" their own message
          });
        }

        // Populate sender for frontend rendering
        await message.populate("sender", "name email");

        // Update last message in chat
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
    // 🗑️ Delete Message
    //
    socket.on("deleteMessage", async ({ chatId, messageId, deleteType, userId }) => {
      if (deleteType === 'forEveryone') {
        // Notify all participants in the chat
        io.to(chatId).emit("messageDeletedForEveryone", { messageId });
      } else if (deleteType === 'forMe') {
        // Notify only the specific user who deleted it (if they are on another device)
        // Or, more commonly, this is handled by the client-side UI directly
        // For other participants, the message remains visible.
        // If we want to notify the other user that *their* message was deleted by the sender,
        // we'd need more complex logic here. For "delete for me", no notification to others.
        // The frontend will handle hiding it for the current user.
      }
      // After deletion, update last message in chat if the deleted message was the last one
      const lastMessage = await Message.findOne({ chat: chatId, isDeletedForEveryone: false, deletedFor: { $ne: userId } }).sort({ createdAt: -1 });
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: lastMessage ? lastMessage.text : "[Chat cleared]",
        updatedAt: new Date(),
      });
      io.to(chatId).emit("chatUpdated", { chatId, lastMessage: lastMessage ? lastMessage.text : "[Chat cleared]" });
    });

    //
    // 🔌 Disconnect
    //
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};