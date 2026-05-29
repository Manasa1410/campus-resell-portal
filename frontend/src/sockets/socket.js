import { io } from "socket.io-client";

// 🔌 Connect to backend server
export const socket = io(import.meta.env.VITE_SOCKET_URL || "https://campus-resell-portal-2.onrender.com", {
  autoConnect: false, // we connect manually after login
});