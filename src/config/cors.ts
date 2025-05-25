import { config } from "dotenv";
import { cors } from "hono/cors";

config();

const allowedOrigins = process.env.ANIWATCH_API_CORS_ALLOWED_ORIGINS
  ? process.env.ANIWATCH_API_CORS_ALLOWED_ORIGINS.split(",")
  : ["http://localhost:4000", "*", "http://localhost:4500", "https://vianime.vercel.app", "https://v-anime.vercel.app"];

  // Remove any empty strings from the array or spaces
allowedOrigins.forEach((origin, index) => {
  allowedOrigins[index] = origin.trim();
  if (allowedOrigins[index] === "") {
    allowedOrigins.splice(index, 1);
  }
});

console.log("CORS allowed origins:", allowedOrigins);

const corsConfig = cors({
  allowMethods: ["GET"],
  maxAge: 600,
  credentials: true,
  origin: allowedOrigins,
});

export default corsConfig;
