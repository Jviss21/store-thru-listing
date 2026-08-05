import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma, isDbReady } from "@/lib/db/client";

export const runtime = "nodejs";

/**
 * POST — assign inventory location to a product by barcode/sku.
 * Body: { barcode, locationName, locationId?, sku?, productId?, orgId? }
 *
 * Updates Prisma Product.location when DB is ready; otherwise returns ok for
 * client localStorage putaway-store to own persistence.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const barcode = String(body.barcode ?? "").trim();
  const locationName = String(body.locationName ?? "").trim();
  if (!barcode || !locationName) {
    return NextResponse.json(
      { ok: false, error: "barcode and locationName required" },
      { status: 400 }
    );
  }

  const orgId =
    (typeof body.orgId === "string" && body.orgId.trim()) || session.user.orgId;
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const sku = typeof body.sku === "string" ? body.sku.trim() : barcode;
  const productId =
    typeof body.productId === "string" && body.productId.trim()
      ? body.productId.trim()
      : null;

  let updatedProductId: string | null = productId;
  let source: "prisma" | "client-only" = "client-only";

  if (isDbReady() && prisma) {
    try {
      const code = barcode.toUpperCase();
      let product = productId
        ? await prisma.product.findFirst({ where: { id: productId, orgId } })
        : null;
      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            orgId,
            OR: [
              { barcode: { equals: barcode, mode: "insensitive" } },
              { sku: { equals: sku, mode: "insensitive" } },
              { barcode: { equals: code, mode: "insensitive" } },
              { sku: { equals: code, mode: "insensitive" } },
            ],
          },
        });
      }
      if (product) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            location: locationName,
            barcode: product.barcode || barcode,
          },
        });
        updatedProductId = product.id;
        source = "prisma";
      }
    } catch (err) {
      console.warn("[putaway] Prisma update skipped:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    source,
    productId: updatedProductId,
    barcode,
    sku,
    locationName,
    locationId: typeof body.locationId === "string" ? body.locationId : null,
    assignedAt: new Date().toISOString(),
  });
}

/** GET ?barcode=&orgId= — look up product location from Prisma when available. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const barcode = request.nextUrl.searchParams.get("barcode")?.trim();
  const orgId =
    request.nextUrl.searchParams.get("orgId")?.trim() || session.user.orgId;
  if (!barcode) {
    return NextResponse.json({ ok: false, error: "barcode required" }, { status: 400 });
  }
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (isDbReady() && prisma) {
    try {
      const product = await prisma.product.findFirst({
        where: {
          orgId,
          OR: [
            { barcode: { equals: barcode, mode: "insensitive" } },
            { sku: { equals: barcode, mode: "insensitive" } },
          ],
        },
      });
      if (product) {
        return NextResponse.json({
          ok: true,
          source: "prisma",
          product: {
            id: product.id,
            sku: product.sku,
            barcode: product.barcode,
            title: product.title,
            location: product.location,
          },
        });
      }
    } catch {
      /* fall through */
    }
  }

  return NextResponse.json({
    ok: true,
    source: "none",
    product: null,
  });
}
