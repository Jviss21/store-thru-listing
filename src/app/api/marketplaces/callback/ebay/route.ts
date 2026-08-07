import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import {
  exchangeEbayAuthCode,
  storeEbayRefreshToken,
} from "@/lib/api/marketplaces/ebay-oauth";

function siteOrigin(request: Request): string {
  const envUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  return new URL(request.url).origin;
}

function parseOrgFromState(state: string | null): string | null {
  if (!state) return null;
  // state format: ebay:{orgId}:{timestamp}
  const parts = state.split(":");
  if (parts[0] !== "ebay" || parts.length < 2) return null;
  return parts[1] || null;
}

/**
 * eBay OAuth redirect — exchange code, store refresh token, redirect to settings.
 * GET /api/marketplaces/callback/ebay?code=...&state=ebay:orgId:...
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const origin = siteOrigin(request);
  const settingsUrl = `${origin}/settings/connections`;

  if (oauthError) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent("Missing authorization code")}`
    );
  }

  const session = await getServerSession(authOptions);
  const orgFromState = parseOrgFromState(state);
  const orgId = orgFromState || session?.user?.orgId;

  if (!orgId) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent("Missing org context for eBay OAuth")}`
    );
  }

  if (
    session?.user &&
    !session.user.isOps &&
    !session.user.membershipOrgIds.includes(orgId)
  ) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent("Forbidden org for eBay OAuth")}`
    );
  }

  const tokens = await exchangeEbayAuthCode(code);
  if (!tokens.ok) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent(tokens.error)}`
    );
  }

  if (!tokens.data.refresh_token) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent("eBay did not return a refresh token")}`
    );
  }

  const stored = await storeEbayRefreshToken(orgId, tokens.data.refresh_token, {
    accountName: "eBay",
  });
  if (!stored.ok) {
    return NextResponse.redirect(
      `${settingsUrl}?ebay=error&message=${encodeURIComponent(stored.error)}`
    );
  }

  return NextResponse.redirect(`${settingsUrl}?ebay=connected`);
}
