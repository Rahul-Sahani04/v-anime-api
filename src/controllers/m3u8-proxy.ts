import axios from "axios";
import type { Context } from "hono";
import { allowedExtensions, LineTransform } from "../utils/line-transform.js";

export const m3u8Proxy = async (c: Context) => {
  try {
    let url = c.req.query("url");
    if (!url) return c.json("url is required", 400);

    // Decode URL and clean it
    try {
      url = decodeURIComponent(url);
    } catch (e) {
      // URL might not be encoded, which is fine
      console.log("URL was not encoded");
    }

    // Remove any existing proxy prefixes
    url = url.replace(/^https?:\/\/[^/]+\/m3u8-proxy\?url=/, '');

    // Clean trailing characters
    url = url.replace(/[}\s]+$/, '');

    // Ensure proper protocol
    if (!url.startsWith('https://')) {
      url = `https://${url.replace(/^https?:\/\//, '')}`;
    }

    console.log(`Cleaned URL: ${url}`);

    const isStaticFiles = allowedExtensions.some((ext: string) => url.endsWith(ext));
    const baseUrl = url.replace(/[^/]+$/, "");

    console.log(`Proxying request to: ${url}`);

    const response = await axios.get(url, {
      responseType: "stream",
      headers: {
        Accept: "*/*",
        Referer: "https://megacloud.club/",
        Origin: "https://megacloud.club",
      },
    });

    const headers = new Headers();
    // Copy over allowed headers
    if (!isStaticFiles) {
      delete response.headers["content-length"];
    }

    // Set CORS and content type headers
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", "*");
    headers.set("Access-Control-Allow-Methods", "*");
    headers.set("Content-Type", isStaticFiles ? response.headers["content-type"] : "application/vnd.apple.mpegurl");
    headers.set("Content-Disposition", "inline");

    // Copy relevant headers from axios response
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) headers.set(key, value.toString());
    });

    // Create a new Response with the appropriate headers and body
    if (isStaticFiles) {
      return new Response(response.data, {
        headers
      });
    }

    const transform = new LineTransform(baseUrl);
    console.log(`Transforming stream for: ${url}`);
    console.log(`Base URL for transformation: ${baseUrl}`);
    console.log(`Proxied URL: ${url}`);

    const transformedStream = response.data.pipe(transform);
    return new Response(transformedStream, {
      headers
    });
  } catch (error: any) {
    console.log(error.message);
    return c.json("Internal Server Error", 500);
  }
};
