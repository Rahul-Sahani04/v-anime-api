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

  // In-memory participant list (simple for MVP single instance)
  // Map<socketId, { roomId, user }>
  const connectedUsers = new Map();
  // Map<roomId, List<user>> could be better, but let's just use connectedUsers and filter or maintain a separate structure.
  // Let's use: Map<roomId, Set<socketId>> to quickly find room members?
  // Actually, Socket.io manages rooms. We just need to map socketId -> UserInfo to send updates.

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a Watch Party Room
    socket.on("join_room", (data: { roomId: string, user: any }) => {
      const { roomId, user } = data;
      socket.join(roomId);
      
      // Store user info
      connectedUsers.set(socket.id, { roomId, user });

      console.log(`Socket ${socket.id} (${user?.email}) joined room ${roomId}`);

      // Broadcast updated participant list
      broadcastParticipants(roomId);
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

    // Player Actions (Sync)
    socket.on("player_action", (data: { roomId: string, type: string, time: number }) => {
        // Broadcast to everyone else in the room
        socket.to(data.roomId).emit("player_action", data);
    });

    // Change Anime
    socket.on("change_anime", (data: { roomId: string, anime: any, episodeId: string }) => {
        io.to(data.roomId).emit("change_anime", data);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userData = connectedUsers.get(socket.id);
      if (userData) {
          connectedUsers.delete(socket.id);
          broadcastParticipants(userData.roomId);
      }
    });

    function broadcastParticipants(roomId: string) {
        // Get all sockets in the room
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        const participants: any[] = [];
        
        if (roomSockets) {
            for (const socketId of roomSockets) {
                const info = connectedUsers.get(socketId);
                if (info) {
                    participants.push(info.user);
                }
            }
        }
        
        // Remove duplicates if same user joined multiple times? For now just send list.
        io.to(roomId).emit("update_participants", participants);
    }
  });

  return io;
}
