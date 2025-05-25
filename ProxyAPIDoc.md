# M3U8 Proxy Server Documentation

## Overview
This project implements a proxy server for M3U8 playlists and their associated media files. It's built using Node.js/Express and TypeScript, designed to handle streaming media content while providing caching capabilities and CORS support.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
npm start
```

The server will run on port 4040 by default.

## API Endpoints

### M3U8 Proxy Endpoint
- **URL**: `/m3u8-proxy`
- **Method**: GET
- **Query Parameters**:
  - `url` (required): The URL of the M3U8 playlist or media file to proxy
- **Example**:
```
GET /m3u8-proxy?url=https://example.com/playlist.m3u8
```

## Core Components

### 1. M3U8 Proxy Controller (`src/controllers/m3u8-proxy.ts`)
Handles incoming requests for M3U8 playlists and media files:
- Validates incoming URLs
- Manages HTTP headers and CORS
- Streams content with proper transformation
- Handles static files differently from M3U8 playlists

```typescript
export const m3u8Proxy = async (req: Request, res: Response) => {
  // Accepts URL parameter
  // Streams and transforms content
  // Handles errors appropriately
}
```

### 2. Line Transform Utility (`src/utils/line-transform.ts`)
Transforms M3U8 playlist content:
- Extends Node.js Transform stream
- Processes playlist lines to rewrite URLs
- Handles various file extensions:
  - `.m3u8` (playlists)
  - `.ts` (video segments)
  - Other static files (images, CSS, JS, etc.)

Supported Extensions:
```typescript
['.ts', '.png', '.jpg', '.webp', '.ico', '.html', '.js', '.css', '.txt']
```

### 3. Caching Middleware (`src/utils/cache-routes.ts`)
Implements caching strategy:
- Cache duration: 1 hour (3600 seconds)
- Public caching enabled (CDN-friendly)
- Mandatory revalidation

### 4. Server Configuration (`src/index.ts`)
Main application setup:
- Express server configuration
- CORS enabled (all origins)
- JSON and URL-encoded body parsing
- Static file serving from 'public' directory
- Cache middleware implementation

## Implementation Guide

To implement this proxy in another API:

1. **Dependencies Setup**
```json
{
  "dependencies": {
    "express": "^4.x.x",
    "axios": "^1.x.x",
    "cors": "^2.x.x",
    "express-cache-controller": "^1.x.x"
  }
}
```

2. **Core Components Implementation**
- Set up the Express server with necessary middleware
- Implement the M3U8 proxy controller
- Create the line transformation utility
- Configure caching middleware

3. **Security Considerations**
- Implement URL validation
- Set appropriate CORS headers
- Configure proper caching headers
- Handle errors gracefully

4. **Performance Optimization**
- Use streaming for data transfer
- Implement efficient caching
- Handle concurrent requests properly

## Error Handling
The proxy implements basic error handling:
- Invalid URL requests return 400
- Server errors return 500
- Network errors are properly logged

## Caching Strategy
- Client-side caching enabled
- Cache duration: 1 hour
- Public caching allowed
- Mandatory revalidation on expiry

This implementation provides a robust and efficient way to proxy M3U8 playlists and their associated media files while handling necessary transformations and caching.