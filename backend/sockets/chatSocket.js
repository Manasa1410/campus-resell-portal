import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

// Keep track of active connections: userId -> socketId
const onlineUsers = new Map();

export const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    //
    // 🔌 Setup User Connection
    //
    socket.on("setup", async (userId) => {
      if (!userId) return;
      socket.userId = userId;
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
      console.log(`👤 User ${userId} is online.`);

      // Broadcast user online status
      io.emit("userStatus", { userId, status: "online" });

      // Mark all messages sent to this user as 'delivered'
      try {
        const chats = await Chat.find({ participants: userId });
        const chatIds = chats.map((c) => c._id);
        
        await Message.updateMany(
          { chat: { $in: chatIds }, sender: { $ne: userId }, status: "sent" },
          { $set: { status: "delivered" } }
        );

        // Notify other participants
        for (const chat of chats) {
          const recipientId = chat.participants.find((p) => p.toString() !== userId.toString());
          if (recipientId) {
            const recipientSocket = onlineUsers.get(recipientId.toString());
            if (recipientSocket) {
              io.to(recipientSocket).emit("chatUpdated", { chatId: chat._id });
            }
          }
        }
      } catch (err) {
        console.error("Error setting delivered status on login:", err);
      }
    });

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.userId = userId;
      socket.join(userId.toString());
      onlineUsers.set(userId.toString(), socket.id);
      io.emit("userStatus", { userId, status: "online" });
    });

    //
    // 🔗 Join Chat Room
    //
    socket.on("joinChat", async (chatId) => {
      socket.join(chatId);
      console.log(`📥 Joined chat room: ${chatId}`);

      // If user is set up, mark all other user's messages in this room as seen
      if (socket.userId) {
        try {
          await Message.updateMany(
            { chat: chatId, sender: { $ne: socket.userId }, status: { $ne: "seen" } },
            { $set: { status: "seen" }, $addToSet: { readBy: socket.userId } }
          );

          // Notify room that messages were read
          socket.to(chatId).emit("messagesSeen", { chatId, readBy: socket.userId });
        } catch (err) {
          console.error("Error marking messages as read on joinChat:", err);
        }
      }
    });

    //
    // 💬 Send Message
    //
    socket.on("sendMessage", async (data) => {
      try {
        const { chatId, senderId, text, file, sharedProduct } = data;

        // Determine message status based on recipient online/room presence
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const recipientId = chat.participants.find((p) => p.toString() !== senderId.toString());
        const recipientSocketId = recipientId ? onlineUsers.get(recipientId.toString()) : null;

        let status = "sent";
        const readBy = [senderId];

        if (recipientSocketId) {
          const roomClients = io.sockets.adapter.rooms.get(chatId);
          if (roomClients && roomClients.has(recipientSocketId)) {
            status = "seen";
            readBy.push(recipientId.toString());
          } else {
            status = "delivered";
          }
        }

        // Save message in DB
        const message = await Message.create({
          chat: chatId,
          sender: senderId,
          text,
          file: file || undefined,
          sharedProduct: sharedProduct || undefined,
          status,
          readBy,
        });

        // Populate sender & sharedProduct for frontend rendering
        await message.populate("sender", "name email");
        if (sharedProduct) {
          await message.populate("sharedProduct", "title price images");
        }

        // Update last message in chat
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: file ? "📷 Image" : sharedProduct ? "🛍️ Shared listing" : text,
          lastMessageAt: new Date(),
        });

        // Emit message to all users in chat room
        io.to(chatId).emit("receiveMessage", message);

        if (recipientId) {
          const notification = await Notification.create({
            recipient: recipientId,
            sender: senderId,
            type: "message",
            message: file ? "New image message" : sharedProduct ? "New shared listing" : `New message: ${text.slice(0, 80)}`,
          });
          io.to(recipientId.toString()).emit("newNotification", notification);
        }

      } catch (error) {
        console.error("❌ Socket sendMessage error:", error.message);
      }
    });

    //
    // ✍️ Typing Indicators
    //
    socket.on("typing", ({ chatId, senderId, name }) => {
      socket.to(chatId).emit("typing", { senderId, name });
    });

    socket.on("stopTyping", ({ chatId, senderId }) => {
      socket.to(chatId).emit("stopTyping", { senderId });
    });

    //
    // 👀 Mark Messages as Read (Explicit)
    //
    socket.on("markAsRead", async (chatId) => {
      if (!socket.userId) return;
      try {
        await Message.updateMany(
          { chat: chatId, sender: { $ne: socket.userId }, status: { $ne: "seen" } },
          { $set: { status: "seen" }, $addToSet: { readBy: socket.userId } }
        );
        socket.to(chatId).emit("messagesSeen", { chatId, readBy: socket.userId });
      } catch (error) {
        console.error("❌ Read error:", error.message);
      }
    });

    //
    // 🗑️ Delete Message
    //
    socket.on("deleteMessage", async ({ chatId, messageId, deleteType, userId }) => {
      if (deleteType === "forEveryone") {
        io.to(chatId).emit("messageDeletedForEveryone", { messageId });
      }

      // Update last message in chat if needed
      const lastMessage = await Message.findOne({
        chat: chatId,
        isDeletedForEveryone: false,
        deletedFor: { $ne: userId }
      }).sort({ createdAt: -1 });

      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: lastMessage ? lastMessage.text : "[Chat cleared]",
        lastMessageAt: new Date(),
      });

      io.to(chatId).emit("chatUpdated", { chatId, lastMessage: lastMessage ? lastMessage.text : "[Chat cleared]" });
    });

    //
    // 🗑️ Delete Chat
    //
    socket.on("deleteChat", ({ chatId }) => {
      io.to(chatId).emit("chatDeleted", { chatId });
    });

    //
    // 🔌 Disconnect
    //
    socket.on("disconnect", async () => {
      console.log("🔴 Socket disconnected:", socket.id);
      if (socket.userId) {
        const userIdStr = socket.userId.toString();
        // Only mark offline if they don't have another socket open (multi-tab check)
        onlineUsers.delete(userIdStr);
        
        const lastSeen = new Date();
        try {
          await User.findByIdAndUpdate(userIdStr, { lastSeen });
        } catch (err) {
          console.error("Error updating user lastSeen on disconnect:", err);
        }

        io.emit("userStatus", { userId: userIdStr, status: "offline", lastSeen });
      }
    });
  });
};
