import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { canSwitchToOrg } from "@/lib/auth/credentials";
import { getOrgById } from "@/lib/orgs";

/** Switch active org for the signed-in user (membership or ops). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { orgId?: string };
  const orgId = body.orgId?.trim();
  if (!orgId || !getOrgById(orgId)) {
    return NextResponse.json({ ok: false, error: "Unknown org" }, { status: 400 });
  }

  const identity = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    handle: session.user.handle,
    isOps: session.user.isOps,
    orgId: session.user.orgId,
    role: session.user.role,
    membershipOrgIds: session.user.membershipOrgIds,
  };

  if (!canSwitchToOrg(identity, orgId)) {
    return NextResponse.json({ ok: false, error: "Not a member of this org" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, orgId });
  response.cookies.set("stl_active_org", orgId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
