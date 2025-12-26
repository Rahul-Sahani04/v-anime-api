import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL is not set in .env");
}

const sql = postgres(connectionString || '');

export async function initSchema() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await sql`
            CREATE TABLE IF NOT EXISTS user_progress (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                anime_id TEXT NOT NULL,
                episode_id TEXT NOT NULL,
                episode_number TEXT,
                poster TEXT,
                title TEXT,
                watched_time INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, anime_id)
            );
        `;
        // Drop tables if they exist to fix type mismatch issues during development
        await sql`DROP TABLE IF EXISTS chat_messages`;
        await sql`DROP TABLE IF EXISTS watch_parties`;

        // Create watch_parties table
        await sql`
            CREATE TABLE IF NOT EXISTS watch_parties (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                anime_id TEXT NOT NULL,
                anime_poster TEXT,
                host_id INTEGER REFERENCES users(id),
                participants_count INTEGER DEFAULT 1,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Create chat_messages table
        await sql`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                room_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id),
                user_email TEXT, -- Cache email for simpler display
                text TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        console.log("Database schema initialized");
    } catch (error) {
        console.error("Error initializing schema:", error);
    }
}

export default sql;
