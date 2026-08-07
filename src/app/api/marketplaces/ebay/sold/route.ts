import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { markFakeEbaySold } from "@/lib/api/marketplaces";

/**
 * Sold on eBay (or Fake eBay) → POST Hammoq Market /sold (end-on-sale).
 * Body: { orgId?, productId|externalId|sku, reason?, orderId? }
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
    reason?: string;
    orderId?: string;
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

  const result = await markFakeEbaySold(externalId, {
    reason: body.reason,
    orderId: body.orderId,
  });
  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.code === "NOT_CONFIGURED" ? 400 : 502,
    });
  }
  return NextResponse.json(result);
}
