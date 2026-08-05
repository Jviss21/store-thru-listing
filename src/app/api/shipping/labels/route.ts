import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { easyPostConfigured, purchaseShippingLabel } from "@/lib/easypost";

export const runtime = "nodejs";

/**
 * POST JSON — purchase (or stub) a shipping label.
 * Body: { orderNumber, carrier?, channel?, channelOrderId?, insuranceCents?,
 *         autoSelectBestRate?, requireSignature?, orgId? }
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

  const orderNumber = String(body.orderNumber ?? "").trim();
  if (!orderNumber) {
    return NextResponse.json({ ok: false, error: "orderNumber required" }, { status: 400 });
  }

  const orgId =
    (typeof body.orgId === "string" && body.orgId.trim()) || session.user.orgId;
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const label = await purchaseShippingLabel({
    orgId,
    orderNumber,
    channelOrderId:
      typeof body.channelOrderId === "string" ? body.channelOrderId : undefined,
    channel: typeof body.channel === "string" ? body.channel : undefined,
    carrier: typeof body.carrier === "string" ? body.carrier : undefined,
    autoSelectBestRate: body.autoSelectBestRate !== false,
    requireSignature: Boolean(body.requireSignature),
    insuranceCents:
      typeof body.insuranceCents === "number" ? body.insuranceCents : null,
    toName: typeof body.toName === "string" ? body.toName : undefined,
  });

  return NextResponse.json({
    ok: true,
    easyPostConfigured: easyPostConfigured(),
    label,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    easyPostConfigured: easyPostConfigured(),
    message: easyPostConfigured()
      ? "EasyPost API key detected — POST to purchase live labels."
      : "No EASYPOST_API_KEY — POST returns printable demo stub labels.",
  });
}
