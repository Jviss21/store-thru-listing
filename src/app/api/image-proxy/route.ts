import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "picsum.photos",
  "i.picsum.photos",
  "fastly.picsum.photos",
  "images.unsplash.com",
  "plus.unsplash.com",
]);

function isAllowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (ALLOWED_HOSTS.has(u.hostname)) return u;
    return null;
  } catch {
    return null;
  }
}

/**
 * Same-origin image fetch so client canvas edits avoid CORS / tainted canvas.
 * Used by listing/product photo editor for remote demo images (e.g. picsum).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const target = isAllowedUrl(raw);
  if (!target) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*,*/*" },
      redirect: "follow",
      next: { revalidate: 3600 },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/") && !contentType.includes("octet-stream")) {
      return NextResponse.json({ error: "Not an image" }, { status: 502 });
    }
    const buf = await upstream.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType.startsWith("image/") ? contentType : "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
