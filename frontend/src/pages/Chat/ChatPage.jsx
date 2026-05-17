import { useEffect, useState, useContext, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { socket } from "../../sockets/socket";
import Loader from "../../components/Loader";
import { getChats, getMessages } from "../../services/chatService";
import { AuthContext } from "../../context/AuthContext";

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const { user } = useContext(AuthContext);

  // 📥 Load all chats
  const fetchChats = async () => {
    try {
      const data = await getChats();
      setChats(data.chats);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 📥 Load messages for selected chat
  const fetchMessages = async (chatId) => {
    try {
      const data = await getMessages(chatId);
      setMessages(data.messages);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    const chatId = searchParams.get("chatId");
    if (chats.length === 0) return;

    if (chatId) {
      const chatToOpen = chats.find((chat) => chat._id === chatId);
      if (chatToOpen) {
        openChat(chatToOpen);
      }
      return;
    }

    if (!activeChat && chats.length > 0) {
      openChat(chats[0]);
    }
  }, [chats, searchParams, activeChat]);

  // 🔌 Socket setup
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
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

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [user?._id]);

  // 💬 Select chat
  const openChat = (chat) => {
    setActiveChat(chat);
    setTypingUser(null);
    fetchMessages(chat._id);
    socket.emit("joinChat", chat._id);
  };

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

  // 📤 Send message
  const sendMessage = async () => {
    if (!text.trim() || !activeChat || !user) return;

    stopTyping();

    const messageData = {
      chatId: activeChat._id,
      senderId: user._id,
      text,
    };

    try {
      socket.emit("sendMessage", messageData);
      setText("");
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex h-screen">
      
      {/* LEFT - Chat list */}
      <div className="w-1/3 border-r p-3 overflow-y-auto">
        <h2 className="text-xl font-bold mb-3">Chats</h2>

        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => openChat(chat)}
            className={`p-3 mb-2 cursor-pointer rounded-lg ${
              activeChat?._id === chat._id
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            <p className="font-semibold">
              {chat.product?.title || "Chat"}
            </p>
            <p className="text-sm truncate">{chat.lastMessage}</p>
          </div>
        ))}
      </div>

      {/* RIGHT - Messages */}
      <div className="w-2/3 flex flex-col">
        
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, i) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMine = senderId?.toString() === user?._id?.toString();
            const senderName = typeof msg.sender === "object"
              ? msg.sender?.name
              : "Seller";

            return (
              <div
                key={msg._id || i}
                className={`mb-3 p-3 rounded-2xl max-w-xl shadow-sm ${
                  isMine
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    {senderName}
                  </p>
                )}
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            );
          })}
        </div>

        {/* Typing status */}
        {typingUser && (
          <div className="px-4 pb-2 text-sm text-gray-500">
            {typingUser} is typing...
          </div>
        )}

        {/* Input */}
        {activeChat && (
          <div className="p-3 border-t flex gap-2">
            <input
              value={text}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex-1 border p-2 rounded"
              placeholder="Type message..."
            />

            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;