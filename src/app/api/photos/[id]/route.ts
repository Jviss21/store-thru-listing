import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readPhoto } from "@/lib/photo-storage";

export const runtime = "nodejs";

/**
 * Serve a locally / memory-stored photo by id.
 * Blob-backed photos are served from the Vercel Blob CDN URL directly.
 */
export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const photo = await readPhoto(id);
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Soft auth: require session, and org membership unless ops.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    !session.user.isOps &&
    !session.user.membershipOrgIds.includes(photo.orgId) &&
    session.user.orgId !== photo.orgId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return new NextResponse(new Uint8Array(photo.bytes), {
    status: 200,
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
