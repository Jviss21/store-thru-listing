import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma, isDbReady, dbMode } from "@/lib/db/client";
import { createMockApiClient } from "@/lib/api/mock-client";

/**
 * Thin products API — Prisma when rows exist, else MockApiClient.
 * Client UI still uses MockApiClient directly in Phase 1; this route is the
 * HTTP seam for Phase 2 swap.
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

  if (isDbReady() && prisma) {
    try {
      const rows = await prisma.product.findMany({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      if (rows.length > 0) {
        return NextResponse.json({
          ok: true,
          source: "prisma",
          dbMode: dbMode(),
          data: rows.map((p) => ({
            id: p.id,
            sku: p.sku,
            title: p.title,
            status: p.status,
            price: p.priceCents / 100,
          })),
        });
      }
    } catch {
      // fall through
    }
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
