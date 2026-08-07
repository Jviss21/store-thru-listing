import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { createEbayClient } from "@/lib/api/marketplaces";

/**
 * Publish / upsert a listing via Fake eBay (Hammoq Market) or real eBay when configured.
 * Body: { orgId?, productId, sku, title, description?, price|priceCents, category?, condition?, brand?, imageUrls? }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: {
    orgId?: string;
    productId?: string;
    sku?: string;
    title?: string;
    description?: string;
    price?: number;
    priceCents?: number;
    category?: string;
    condition?: string;
    brand?: string;
    imageUrls?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "BAD_REQUEST" }, { status: 400 });
  }

  const orgId = body.orgId?.trim() || session.user.orgId;
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const sku = (body.sku || "").trim();
  const title = (body.title || "").trim();
  const productId = (body.productId || "").trim();
  if (!sku || !title) {
    return NextResponse.json(
      { ok: false, error: "sku and title are required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const priceCents =
    typeof body.priceCents === "number" && body.priceCents > 0
      ? Math.round(body.priceCents)
      : typeof body.price === "number" && body.price > 0
        ? Math.round(body.price * 100)
        : 0;
  if (priceCents <= 0) {
    return NextResponse.json(
      { ok: false, error: "price or priceCents is required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const client = createEbayClient();
  const result = await client.createListing({
    orgId,
    sku,
    title,
    description: body.description,
    priceCents,
    imageUrls: body.imageUrls,
    externalId: productId || sku,
    category: body.category,
    condition: body.condition,
    brand: body.brand,
  });

  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.code === "NOT_CONFIGURED" ? 400 : 502,
    });
  }

  return NextResponse.json(result);
}
