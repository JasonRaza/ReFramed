import { NextResponse } from "next/server";
import { fetchImageBase64 } from "@/lib/fetch-image";

/**
 * GET /api/proxy-image?url=<encoded_url>
 * Proxies an external image through our server so the browser can load it
 * even when the CDN blocks direct hotlinking (e.g. Wikimedia Commons).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("url param requis", { status: 400 });
  }

  // Only proxy known safe domains
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("URL invalide", { status: 400 });
  }

  const allowed = ["upload.wikimedia.org", "commons.wikimedia.org"];
  if (!allowed.some((d) => parsed.hostname === d || parsed.hostname.endsWith("." + d))) {
    // Also allow Supabase storage URLs
    if (!parsed.hostname.endsWith(".supabase.co")) {
      return new NextResponse("Domaine non autorisé", { status: 403 });
    }
  }

  const b64 = await fetchImageBase64(url);
  if (!b64) {
    return new NextResponse("Impossible de charger l'image", { status: 502 });
  }

  const buffer = Buffer.from(b64, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400", // 24h cache
    },
  });
}
