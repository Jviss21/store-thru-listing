import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { getMarketplaceClient } from "@/lib/api/marketplaces";
import type { MarketplaceChannel } from "@/lib/api/marketplaces";

function siteOrigin(request: Request): string {
  const envUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: { orgId?: string; channel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON", code: "BAD_REQUEST" }, { status: 400 });
  }

  const orgId = body.orgId?.trim() || session.user.orgId;
  const channel = body.channel as MarketplaceChannel | undefined;
  if (channel !== "ShopGoodwill" && channel !== "eBay") {
    return NextResponse.json(
      { ok: false, error: "channel must be ShopGoodwill or eBay", code: "BAD_REQUEST" },
      { status: 400 }
    );
  }

  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const client = getMarketplaceClient(channel);
  const status = client.status();
  if (!status.configured) {
    return NextResponse.json({
      ok: true,
      data: {
        configured: false,
        missingEnv: status.missingEnv,
      },
    });
  }

  const redirectUri = `${siteOrigin(request)}/api/marketplaces/callback/${channel === "eBay" ? "ebay" : "shopgoodwill"}`;
  const oauth = await client.startOAuth(orgId, redirectUri);
  if (!oauth.ok) {
    return NextResponse.json(oauth, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      configured: true,
      missingEnv: [] as string[],
      authorizeUrl: oauth.data.authorizeUrl,
      state: oauth.data.state,
    },
  });
}
