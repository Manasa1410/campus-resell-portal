import API from "./api";

// 💬 Get all chats of logged-in user
export const getChats = async () => {
  const { data } = await API.get("/chats");
  return data;
};

// 📩 Get messages of a specific chat
export const getMessages = async (chatId) => {
  const { data } = await API.get(`/chats/${chatId}/messages`);
  return data;
};

// ➕ Create or get chat for a product + seller
export const createChat = async (productId, sellerId) => {
  const { data } = await API.post("/chats", {
    userId: sellerId,
    productId,
  });

  return data;
};

// 🗑️ delete single message
export const deleteMessage = async (id, deleteType) => {
  const { data } = await API.delete(`/chats/message/${id}`, { data: { deleteType } });
  return data;
};

// 🗑️ delete full chat
export const deleteChat = async (conversationId) => {
  const { data } = await API.delete(`/chats/${conversationId}`);
  return data;
};

// 🔢 Get total unread count for global badge
export const getUnreadMessageCount = async () => {
  const { data } = await API.get("/chats/unread-count");
  return data;
};