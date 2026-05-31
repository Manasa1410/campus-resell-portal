import { io } from "socket.io-client";

// 🔌 Connect to backend server
const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// 🔌 Connect to backend server
export const socket = io(socketUrl, {
  autoConnect: false, // we connect manually after login
});