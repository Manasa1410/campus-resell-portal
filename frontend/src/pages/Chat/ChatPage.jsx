/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../../sockets/socket";
import { getChats, getMessages, deleteMessage, deleteChat, uploadChatImage } from "../../services/chatService";
import ReportModal from "../../services/ReportModal";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const ChatSkeleton = () => (
  <div className="grid h-[calc(100vh-150px)] min-h-155 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[360px_1fr]">
    <div className="border-r border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-5 h-9 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="mb-3 flex animate-pulse gap-3 rounded-xl p-3">
          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex flex-col p-6">
      <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      <div className="mt-8 flex-1 space-y-4">
        <div className="h-12 w-2/5 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-blue-100 dark:bg-blue-950/60" />
        <div className="h-12 w-1/3 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  </div>
);

const ActionMenu = ({ align = "right", children }) => (
  <div
    className={`absolute top-8 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-700 shadow-xl transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
      align === "left" ? "left-0" : "right-0"
    }`}
  >
    {children}
  </div>
);

const MenuButton = ({ children, danger, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`block w-full px-4 py-2 text-left transition hover:bg-slate-50 ${
      danger ? "text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40" : "text-slate-700 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
    }`}
  >
    {children}
  </button>
);

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const activeChatRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const fetchChats = async () => {
    try {
      const data = await getChats();
      setChats(data.chats);
      data.chats.forEach((chat) => {
        socket.emit("joinChat", chat._id);
      });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const data = await getMessages(chatId);
      setMessages(data.messages);
      socket.emit("markMessagesAsSeen", { chatId, userId: user._id });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const chatIdFromURL = searchParams.get("chatId");
    if (chats.length === 0) return;

    if (chatIdFromURL) {
      if (activeChat?._id === chatIdFromURL) return;

      const chatToOpen = chats.find((chat) => chat._id === chatIdFromURL);
      if (chatToOpen) {
        openChat(chatToOpen);
      }
      return;
    }

    if (!activeChat && chats.length > 0) {
      openChat(chats[0]);
    }
  }, [chats.length, searchParams.get("chatId"), activeChat?._id]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    if (user?._id) {
      socket.emit("setup", user._id);
    }

    const handleReceiveMessage = (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender;
      const currentUserId = user?._id?.toString() || user?.id?.toString();
      const isMine = senderId?.toString() === currentUserId;
      const isChatOpen = activeChatRef.current?._id === newMessage.chat;

      if (isChatOpen) {
        setMessages((prev) => (prev.find((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]));
      }

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === newMessage.chat
            ? {
                ...chat,
                lastMessage: newMessage.text,
                unreadCount: !isMine && !isChatOpen ? (chat.unreadCount || 0) + 1 : chat.unreadCount || 0,
              }
            : chat
        )
      );
    };

    const handleMessageStatusUpdate = ({ messageId, status, readBy }) => {
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? { ...msg, status, readBy } : msg)));
    };

    const handleTyping = ({ senderId, name }) => {
      if (senderId?.toString() !== user?._id?.toString()) {
        setTypingUser(name || "Partner");
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId?.toString() !== user?._id?.toString()) {
        setTypingUser(null);
      }
    };

    const handleMessageDeletedForEveryone = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, isDeletedForEveryone: true, text: "[Message deleted]" } : msg))
      );
    };

    const handleChatDeleted = ({ chatId }) => {
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));

      if (activeChat?._id === chatId) {
        setActiveChat(null);
        setMessages([]);
      }
    };

    const handleChatUpdated = ({ chatId, lastMessage }) => {
      setChats((prevChats) => prevChats.map((chat) => (chat._id === chatId ? { ...chat, lastMessage } : chat)));
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageStatusUpdate", handleMessageStatusUpdate);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageDeletedForEveryone", handleMessageDeletedForEveryone);
    socket.on("chatDeleted", handleChatDeleted);
    socket.on("chatUpdated", handleChatUpdated);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageStatusUpdate", handleMessageStatusUpdate);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageDeletedForEveryone", handleMessageDeletedForEveryone);
      socket.off("chatDeleted", handleChatDeleted);
      socket.off("chatUpdated", handleChatUpdated);
    };
  }, [user?._id, activeChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openChat(chat) {
    setActiveChat(chat);
    setTypingUser(null);
    setIsChatMenuOpen(false);
    fetchMessages(chat._id);
    socket.emit("joinChat", chat._id);

    setChats((prevChats) => prevChats.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)));
  }

  const stopTyping = () => {
    if (activeChat && user && isTypingRef.current) {
      socket.emit("stopTyping", {
        chatId: activeChat._id,
        senderId: user._id,
      });
      isTypingRef.current = false;
    }
  };

  const handleInputChange = (value) => {
    setText(value);

    if (!activeChat || !user) return;

    if (!isTypingRef.current) {
      socket.emit("typing", {
        chatId: activeChat._id,
        senderId: user._id,
        name: user.name,
      });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const sendMessage = async ({ shareProduct = false } = {}) => {
    if ((!text.trim() && !imageFile && !shareProduct) || !activeChat || !user) return;

    stopTyping();

    try {
      let uploadedFile = "";
      if (imageFile) {
        const upload = await uploadChatImage(imageFile);
        uploadedFile = upload.fileUrl;
      }

      socket.emit("sendMessage", {
        chatId: activeChat._id,
        senderId: user._id,
        text: text.trim(),
        file: uploadedFile,
        sharedProduct: shareProduct ? activeChat.product?._id : undefined,
      });
      setText("");
      setImageFile(null);
    } catch (err) {
      console.log(err);
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async (messageId, deleteType) => {
    try {
      if (deleteType === "forEveryone" && !window.confirm("Delete this message for everyone?")) return;

      await deleteMessage(messageId, deleteType);
      setOpenMessageMenuId(null);

      if (deleteType === "forEveryone") {
        socket.emit("deleteMessage", { chatId: activeChat._id, messageId, deleteType, userId: user._id });
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? deleteType === "forEveryone"
              ? { ...msg, isDeletedForEveryone: true, text: "[Message deleted]" }
              : { ...msg, deletedFor: [...(msg.deletedFor || []), user._id] }
            : msg
        )
      );

      if (deleteType === "forMe") {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteChat = async () => {
    try {
      if (!activeChat?._id) return;
      if (!window.confirm("Delete this entire chat? This action cannot be undone.")) return;

      await deleteChat(activeChat._id);
      socket.emit("deleteChat", { chatId: activeChat._id });
      setChats((prev) => prev.filter((c) => c._id !== activeChat._id));
      setActiveChat(null);
      setMessages([]);
      setIsChatMenuOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete chat");
    }
  };

  const partner = activeChat?.participants?.find((participant) => participant._id !== user?._id);

  if (loading) return <ChatSkeleton />;

  return (
    <div className="grid h-[calc(100vh-150px)] min-h-155 overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-md transition-colors duration-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100 lg:grid-cols-[360px_1fr]">
      <aside className="flex min-h-0 flex-col border-b border-gray-200 bg-white transition-colors duration-200 dark:border-gray-700 dark:bg-slate-800 lg:border-b-0 lg:border-r">
        <div className="border-b border-gray-200 p-5 transition-colors duration-200 dark:border-gray-700">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Inbox</p>
          <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-gray-100">Messages</h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {chats.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 transition-colors duration-200 dark:border-slate-700 dark:text-slate-400">
              No chats yet. Open a listing to start a conversation.
            </div>
          )}

          {chats.map((chat) => {
            const isActive = activeChat?._id === chat._id;

            return (
              <button
                type="button"
                key={chat._id}
                onClick={() => openChat(chat)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none"
                    : "text-gray-900 hover:bg-slate-50 dark:text-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <img
                  src={chat.product?.images?.[0] || "/default-product.png"}
                  alt={chat.product?.title || "Product"}
                  className="h-12 w-12 rounded-xl border border-white/70 object-cover shadow-sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{chat.product?.title || "Chat"}</span>
                  <span className={`mt-1 block truncate text-xs transition-colors duration-200 ${isActive ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                    {chat.lastMessage || "No messages yet."}
                  </span>
                </span>
                {chat.unreadCount > 0 && (
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-gray-50 transition-colors duration-200 dark:bg-slate-900">
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 transition-colors duration-200 dark:border-gray-700 dark:bg-slate-800">
          {activeChat ? (
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={activeChat.product?.images?.[0] || "/default-product.png"}
                alt={activeChat.product?.title || "Product"}
                className="h-12 w-12 rounded-xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <h2 className="truncate text-base font-black text-gray-900 dark:text-white transition-colors duration-200">{activeChat.product?.title || "Chat"}</h2>
                <p className="truncate text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-200">
                  {partner?.name ? `Chatting with ${partner.name}` : "Campus marketplace conversation"}
                  {activeChat.product?.price ? ` - INR ${activeChat.product.price}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-black text-gray-900 dark:text-white transition-colors duration-200">Select a conversation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Your messages will appear here.</p>
            </div>
          )}

          {activeChat && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsChatMenuOpen((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl font-bold text-slate-600 transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Chat actions"
              >
                ⋮
              </button>
              {isChatMenuOpen && (
                <ActionMenu>
                  <MenuButton danger onClick={handleDeleteChat}>
                    Delete chat
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      toast.success("User blocked locally for this session");
                      setIsChatMenuOpen(false);
                    }}
                  >
                    Block user
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMessageToReport(null);
                      setIsReportModalOpen(true);
                      setIsChatMenuOpen(false);
                    }}
                  >
                    Report user
                  </MenuButton>
                </ActionMenu>
              )}
            </div>
          )}
        </header>

        {activeChat && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => {
              setIsReportModalOpen(false);
              setMessageToReport(null);
            }}
            reportedUser={messageToReport ? undefined : partner?._id}
            message={messageToReport}
          />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const senderId = msg.sender?._id || msg.sender;
              const isMine = senderId?.toString() === (user?._id || user?.id)?.toString();
              const senderName = typeof msg.sender === "object" ? msg.sender?.name : "User";
              const isDeletedForMe = msg.deletedFor?.includes(user._id);
              if (isDeletedForMe) return null;

              return (
                <div key={msg._id || i} className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[82%] rounded-2xl px-4 py-3 shadow-sm transition-colors duration-200 ${
                      isMine
                        ? "rounded-br-md bg-blue-600 text-white"
                        : "rounded-bl-md border border-gray-200 bg-gray-200 text-gray-900 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
                    }`}
                  >
                    {!isMine && <p className="mb-1 text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors duration-200">{senderName}</p>}
                    {msg.isDeletedForEveryone ? (
                      <p className="whitespace-pre-line pr-6 text-sm italic leading-6 opacity-70">This message was deleted</p>
                    ) : (
                      <>
                        {msg.file && (
                          <img
                            src={msg.file.startsWith("http") ? msg.file : `http://localhost:5001${msg.file}`}
                            alt="Shared in chat"
                            className="mb-2 max-h-64 rounded-xl object-cover"
                          />
                        )}
                        {msg.sharedProduct && (
                          <div
                            className="mb-2 rounded-xl p-3 border border-gray-100 bg-white text-gray-900 transition-colors duration-200 dark:border-gray-700 dark:bg-slate-800 dark:text-white"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors duration-200">Shared product</p>
                            <p className="mt-1 text-sm font-black text-gray-900 dark:text-white transition-colors duration-200">{msg.sharedProduct.title}</p>
                            <p className="mt-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">INR {msg.sharedProduct.price}</p>
                          </div>
                        )}
                        {msg.text && <p className="whitespace-pre-line pr-6 text-sm leading-6">{msg.text}</p>}
                      </>
                    )}
                    <div className={`mt-1 text-right text-[11px] transition-colors duration-200 ${isMine ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      {isMine && !msg.isDeletedForEveryone ? ` - ${msg.status === "seen" ? "Seen" : msg.status === "delivered" ? "Delivered" : "Sent"}` : ""}
                    </div>

                    {!msg.isDeletedForEveryone && (
                      <div className={`absolute top-2 ${isMine ? "right-2" : "right-2"}`}>
                        <button
                          type="button"
                          onClick={() => setOpenMessageMenuId(openMessageMenuId === msg._id ? null : msg._id)}
                          className={`grid h-7 w-7 place-items-center rounded-full text-base opacity-0 transition group-hover:opacity-100 ${
                            isMine ? "text-white hover:bg-blue-700" : "text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-600"
                          }`}
                          aria-label="Message actions"
                        >
                          ⋮
                        </button>
                        {openMessageMenuId === msg._id && (
                          <ActionMenu align={isMine ? "right" : "left"}>
                            <MenuButton danger onClick={() => handleDeleteMessage(msg._id, "forMe")}>
                              Delete for me
                            </MenuButton>
                            {isMine && (
                              <MenuButton danger onClick={() => handleDeleteMessage(msg._id, "forEveryone")}>
                                Delete for everyone
                              </MenuButton>
                            )}
                            <MenuButton
                              onClick={() => {
                                setIsReportModalOpen(true);
                                setMessageToReport(msg._id);
                                setOpenMessageMenuId(null);
                              }}
                            >
                              Report
                            </MenuButton>
                          </ActionMenu>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {typingUser && <div className="px-5 pb-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors duration-200">{typingUser} is typing...</div>}

        {activeChat && user && (
          <div className="border-t border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-gray-700 dark:bg-slate-800">
            {imageFile && (
              <div className="mb-2 flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                <span className="truncate">Image ready: {imageFile.name}</span>
                <button type="button" onClick={() => setImageFile(null)} className="text-blue-900 dark:text-blue-200">
                  Remove
                </button>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <label className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-600 transition-colors duration-200 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" title="Share image">
                +
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
              <button
                type="button"
                onClick={() => sendMessage({ shareProduct: true })}
                className="hidden rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition-colors duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 sm:block"
              >
                Share Product
              </button>
              <input
                value={text}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition-colors duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-100 dark:focus:bg-slate-900 dark:focus:ring-blue-950"
                placeholder="Type a message..."
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!text.trim() && !imageFile}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ChatPage;
