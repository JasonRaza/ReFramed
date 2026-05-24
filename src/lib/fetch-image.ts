/**
 * Shared image-fetch utility for server-side API routes.
 * Wikimedia (and most CDNs) block non-browser User-Agent strings,
 * so we mimic a real browser request.
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "image/webp,image/jpeg,image/png,image/*,*/*",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  Referer: "https://www.google.com/",
};

/**
 * Fetches an image URL and returns its content as a base64 string.
 * Returns null if the fetch fails for any reason.
 */
export async function fetchImageBase64(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      // no next-cache revalidate — always fresh
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[fetch-image] ${res.status} ${res.statusText} → ${url}`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      console.error(`[fetch-image] Wrong content-type "${contentType}" → ${url}`);
      return null;
    }
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch (err) {
    console.error(`[fetch-image] Fetch error for ${url}:`, err);
    return null;
  }
}
