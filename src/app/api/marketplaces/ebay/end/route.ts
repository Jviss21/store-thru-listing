import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { createEbayClient } from "@/lib/api/marketplaces";

/**
 * End / delist Fake eBay listing on Hammoq Market (no sale).
 * Body: { orgId?, productId|externalId|sku }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: {
    orgId?: string;
    productId?: string;
    externalId?: string;
    sku?: string;
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

  const externalId = (body.externalId || body.productId || body.sku || "").trim();
  if (!externalId) {
    return NextResponse.json(
      { ok: false, error: "productId, externalId, or sku is required", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  const result = await createEbayClient().endListing(orgId, externalId);
  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.code === "NOT_CONFIGURED" ? 400 : 502,
    });
  }
  return NextResponse.json(result);
}
