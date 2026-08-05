import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma, isDbReady } from "@/lib/db/client";
import { blobConfigured, storePhoto, toDataUrl } from "@/lib/photo-storage";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * POST multipart/form-data:
 *  - file: image blob (required)
 *  - productId: optional product id to attach
 *  - orgId: optional override (ops)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart body" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image exceeds 8 MB limit" }, { status: 400 });
  }

  const requestedOrg =
    (typeof form.get("orgId") === "string" ? String(form.get("orgId")).trim() : "") ||
    session.user.orgId;
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(requestedOrg)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const productIdRaw = form.get("productId");
  const productId =
    typeof productIdRaw === "string" && productIdRaw.trim() ? productIdRaw.trim() : null;

  const ab = await file.arrayBuffer();
  const bytes = Buffer.from(ab);
  const stored = await storePhoto({
    orgId: requestedOrg,
    productId,
    bytes,
    contentType: file.type || "image/jpeg",
    filename: file.name,
  });

  // When Prisma is ready and product exists, append URL to photosJson + Photo row.
  if (productId && isDbReady() && prisma) {
    try {
      const product = await prisma.product.findFirst({
        where: { id: productId, orgId: requestedOrg },
      });
      if (product) {
        let urls: string[] = [];
        try {
          urls = product.photosJson ? (JSON.parse(product.photosJson) as string[]) : [];
          if (!Array.isArray(urls)) urls = [];
        } catch {
          urls = [];
        }
        urls.push(stored.url);
        await prisma.product.update({
          where: { id: product.id },
          data: { photosJson: JSON.stringify(urls) },
        });
        await prisma.photo.create({
          data: {
            orgId: requestedOrg,
            productId: product.id,
            storageKey: stored.storageKey || stored.url,
            sortOrder: urls.length - 1,
          },
        });
      }
    } catch (err) {
      console.warn("[photos/upload] Prisma attach skipped:", err);
    }
  }

  const payload: Record<string, unknown> = {
    ok: true,
    id: stored.id,
    url: stored.url,
    storageKey: stored.storageKey,
    backend: stored.backend,
    blobConfigured: blobConfigured(),
    contentType: stored.contentType,
  };

  // Cold-start safety for memory backend: client can persist the data URL overlay.
  if (stored.backend === "memory" || stored.backend === "data-url") {
    payload.dataUrl = toDataUrl(stored.contentType, bytes);
  }

  return NextResponse.json(payload);
}
