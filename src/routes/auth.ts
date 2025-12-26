import { Hono } from "hono";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sign, verify } from "hono/jwt"; // Using Hono's JWT helper for lighter footprint
import sql from "../db.js";

const authRouter = new Hono();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

// Schema for input validation
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/v2/auth/register
authRouter.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password } = registerSchema.parse(body);

    // Check existing
    const existing = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username}`;
    if (existing.length > 0) {
      return c.json({ success: false, message: "User or Email already exists" }, 409);
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Insert
    const [user] = await sql`
      INSERT INTO users (username, email, hash)
      VALUES (${username}, ${email}, ${hash})
      RETURNING id, username, email, created_at
    `;

    // Generate Token
    const token = await sign({ id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, SECRET);

    return c.json({ success: true, user, token }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, message: "Validation Error", errors: error.errors }, 400);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal Server Error" }, 500);
  }
});

// POST /api/v2/auth/login
authRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (!user) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.hash);
    if (!valid) {
      return c.json({ success: false, message: "Invalid credentials" }, 401);
    }

    // Generate Token
    const token = await sign({ id: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, SECRET); // 7 days

    // Remove hash
    delete user.hash;

    return c.json({ success: true, user, token }, 200);
  } catch (error) {
     if (error instanceof z.ZodError) {
      return c.json({ success: false, message: "Invalid Input" }, 400);
    }
    console.error(error);
    return c.json({ success: false, message: "Internal Server Error" }, 500);
  }
});

// GET /api/v2/auth/me
authRouter.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return c.json({ success: false, message: "Unauthorized" }, 401);

  const token = authHeader.split(" ")[1];
  try {
    const payload = await verify(token, SECRET);
    
    // Fetch fresh user data
    const [user] = await sql`SELECT id, username, email, created_at FROM users WHERE id = ${payload.id}`;
    
    if (!user) return c.json({ success: false, message: "User not found" }, 404);

    return c.json({ success: true, user });
  } catch (err) {
    return c.json({ success: false, message: "Invalid Token" }, 401);
  }
});

export { authRouter };
