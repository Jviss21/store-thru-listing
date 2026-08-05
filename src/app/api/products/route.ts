import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma, isDbReady, dbMode } from "@/lib/db/client";
import { createProduct, listProductsForOrg } from "@/lib/db/products";
import { createMockApiClient } from "@/lib/api/mock-client";
import { preferDbWrites } from "@/lib/db/domain";

/**
 * Products API — Prisma when rows exist (or on POST), else MockApiClient.
 * GET merges preference: DB rows when present; mock for empty catalog demo.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const orgId =
    request.nextUrl.searchParams.get("orgId")?.trim() || session.user.orgId;

  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const includeMock =
    request.nextUrl.searchParams.get("includeMock") !== "0";

  if (isDbReady() && prisma) {
    const rows = await listProductsForOrg(orgId);
    if (rows && rows.length > 0) {
      return NextResponse.json({
        ok: true,
        source: "prisma",
        dbMode: dbMode(),
        data: rows.map((p) => ({
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          title: p.title,
          status: p.status,
          price: p.price,
          location: p.location,
          supplier: p.supplier,
          category: p.category,
          imageUrls: p.imageUrls,
          tags: p.tags,
          createdAt: p.createdAt,
          listedOn: [] as string[],
        })),
      });
    }
  }

  if (!includeMock) {
    return NextResponse.json({
      ok: true,
      source: "prisma",
      dbMode: dbMode(),
      data: [],
    });
  }

  const mock = createMockApiClient();
  const res = await mock.products.list(orgId);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    source: "mock",
    dbMode: dbMode(),
    data: res.data,
  });
}

/** Create a single product in Postgres when available. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    orgId?: string;
    sku?: string;
    title?: string;
    barcode?: string;
    status?: string;
    price?: number;
    location?: string;
    supplier?: string;
    category?: string;
    description?: string;
    tags?: string[];
    imageUrls?: string[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.orgId?.trim() || session.user.orgId).trim();
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const sku = (body.sku ?? "").trim();
  const title = (body.title ?? "").trim();
  if (!sku || !title) {
    return NextResponse.json(
      { ok: false, error: "sku and title required" },
      { status: 400 }
    );
  }

  if (!preferDbWrites(orgId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Database unavailable",
        dbMode: dbMode(),
        fallback: "mock",
      },
      { status: 503 }
    );
  }

  const created = await createProduct({
    orgId,
    sku,
    title,
    barcode: body.barcode,
    status: body.status ?? "Draft",
    priceCents: Math.round((body.price ?? 0) * 100),
    location: body.location,
    supplier: body.supplier,
    category: body.category,
    description: body.description,
    photos: body.imageUrls,
    tags: body.tags,
    createdById: session.user.id,
  });

  if (!created) {
    return NextResponse.json(
      { ok: false, error: "Could not create product", fallback: "mock" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: created,
  });
}
