import { Hono } from "hono";
import sql from "../db.js";

export const partyRouter = new Hono();

// List active rooms
partyRouter.get("/", async (c) => {
    try {
        const rooms = await sql`
            SELECT 
                wp.*, 
                u.email as host_email
            FROM watch_parties wp
            LEFT JOIN users u ON wp.host_id = u.id
            ORDER BY wp.created_at DESC
        `;
        return c.json({ success: true, data: rooms });
    } catch (error) {
        console.error("Error fetching rooms", error);
        return c.json({ success: false, message: "Server error" }, 500);
    }
});

// Create Room
partyRouter.post("/", async (c) => {
    try {
        const body = await c.req.json();
        const { name, anime_id, anime_poster, host_id } = body;

        const [room] = await sql`
            INSERT INTO watch_parties (name, anime_id, anime_poster, host_id)
            VALUES (${name}, ${anime_id}, ${anime_poster}, ${host_id})
            RETURNING *
        `;

        return c.json({ success: true, data: room });
    } catch (error) {
        console.error("Error creating room", error);
        return c.json({ success: false, message: "Server error" }, 500);
    }
});

// Get Room Messages
partyRouter.get("/:id/messages", async (c) => {
    try {
        const roomId = c.req.param("id");
        const messages = await sql`
            SELECT * FROM chat_messages 
            WHERE room_id = ${roomId}
            ORDER BY created_at ASC
            LIMIT 100
        `;
        return c.json({ success: true, data: messages });
    } catch (error) {
        console.error("Error fetching messages", error);
        return c.json({ success: false, message: "Server error" }, 500);
    }
});
