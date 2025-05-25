import { m3u8Proxy } from '../controllers/m3u8-proxy.js';
import { Hono } from 'hono';

// Create a new Hono router instance
const router = new Hono();

// Add the m3u8 proxy route
router.get('/', m3u8Proxy);

// Export the router instance
export const m3u8_router = router;