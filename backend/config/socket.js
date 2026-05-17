import { Server } from "socket.io";
import { chatSocket } from "../sockets/chatSocket.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // change to frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  chatSocket(io);

  return io;
};

export const getIO = () => io;