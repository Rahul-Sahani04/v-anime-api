# M3U8 Proxy Usage Guide

This document describes how to use the m3u8 proxy endpoint in your frontend application.

## Endpoint

```
GET /m3u8-proxy?url={encodedUrl}
```

### Parameters

- `url` (required): The URL of the m3u8 playlist or video segment to proxy, must be URL-encoded

## Usage Examples

### 1. Basic Implementation with HLS.js

```javascript
import Hls from 'hls.js';

const videoElement = document.querySelector('video');
const videoUrl = 'https://example.com/video.m3u8';

// Function to create proxied URL
function getProxiedUrl(url) {
  const encodedUrl = encodeURIComponent(url);
  return `${API_BASE_URL}/m3u8-proxy?url=${encodedUrl}`;
}

if (Hls.isSupported()) {
  const hls = new Hls();
  // Use the proxy URL instead of direct URL
  hls.loadSource(getProxiedUrl(videoUrl));
  hls.attachMedia(videoElement);
}
```

### 2. Using with Video.js

```javascript
import videojs from 'video.js';

const player = videojs('my-video', {
  html5: {
    hls: {
      overrideNative: true,
      customHlsUrlHandler: function(url) {
        return `${API_BASE_URL}/m3u8-proxy?url=${encodeURIComponent(url)}`;
      }
    }
  }
});

player.src({
  src: 'https://example.com/video.m3u8',
  type: 'application/x-mpegURL'
});
```

### 3. Direct Video Element Usage

```html
<video controls>
  <source 
    src="/m3u8-proxy?url=https%3A%2F%2Fexample.com%2Fvideo.m3u8" 
    type="application/x-mpegURL"
  >
</video>
```

## Error Handling

The proxy endpoint returns standard HTTP status codes:

- `400`: Missing or invalid url parameter
- `500`: Internal server error or upstream request failed

Example error handling:

```javascript
async function loadVideo(url) {
  try {
    const proxiedUrl = getProxiedUrl(url);
    const response = await fetch(proxiedUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Handle successful response
  } catch (error) {
    console.error('Error loading video:', error);
    // Show user-friendly error message
  }
}
```

## Notes

1. The proxy automatically handles:
   - CORS headers
   - URL rewriting for nested m3u8 files
   - Static video segments

2. For better performance:
   - The proxy includes appropriate cache headers
   - Consider implementing client-side caching where appropriate

3. Security:
   - Always validate video URLs on your backend before passing them to the proxy
   - The proxy includes basic rate limiting for production deployments