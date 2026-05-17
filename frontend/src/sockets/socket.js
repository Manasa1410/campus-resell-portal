import { io } from "socket.io-client";

// 🔌 Connect to backend server
export const socket = io("http://localhost:5001", {
  autoConnect: false, // we connect manually after login
});