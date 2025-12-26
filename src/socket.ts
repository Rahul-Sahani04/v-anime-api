import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "node:http";
import sql from "./db.js";

export function initSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow all for dev, restrict in prod
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a Watch Party Room
    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle Chat Message
    socket.on("send_message", async (data: { roomId: string; userId: string; userEmail: string; text: string }) => {
      const { roomId, userId, userEmail, text } = data;
      
      // 1. Broadcast to room immediately for low latency
      io.to(roomId).emit("receive_message", {
        id: crypto.randomUUID(), // Temporary ID for frontend
        user: userEmail?.split('@')[0] || "User",
        text,
        user_id: userId,
        created_at: new Date().toISOString()
      });

      // 2. Persist to DB asynchronously
      try {
        await sql`
            INSERT INTO chat_messages (room_id, user_id, user_email, text)
            VALUES (${roomId}, ${userId}, ${userEmail}, ${text})
        `;
      } catch (error) {
        console.error("Failed to save message", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
