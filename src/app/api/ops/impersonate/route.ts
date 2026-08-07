import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { canSwitchToOrg } from "@/lib/auth/credentials";
import { getOrgById } from "@/lib/orgs";
import { recordAuditEvent } from "@/lib/db/audit";

/** Ops-only: set active org (impersonation start) or end impersonation. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isOps) {
    return NextResponse.json({ ok: false, error: "Ops only" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    orgId?: string;
    end?: boolean;
    previousOrgId?: string;
  };

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

  if (body.end) {
    const restoreOrgId =
      (body.previousOrgId || body.orgId || session.user.orgId || "").trim() ||
      session.user.membershipOrgIds[0];
    if (!restoreOrgId || !getOrgById(restoreOrgId)) {
      return NextResponse.json({ ok: false, error: "Unknown restore org" }, { status: 400 });
    }
    if (!canSwitchToOrg(identity, restoreOrgId)) {
      return NextResponse.json({ ok: false, error: "Cannot end impersonation" }, { status: 403 });
    }

    await recordAuditEvent({
      orgId: restoreOrgId,
      userId: session.user.id,
      action: "ops.impersonate_end",
      meta: {
        restoreOrgId,
        endedOrgId: body.orgId ?? null,
        handle: session.user.handle,
      },
    });

    const response = NextResponse.json({ ok: true, orgId: restoreOrgId, ended: true });
    response.cookies.set("stl_active_org", restoreOrgId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  const orgId = body.orgId?.trim();
  if (!orgId || !getOrgById(orgId)) {
    return NextResponse.json({ ok: false, error: "Unknown org" }, { status: 400 });
  }

  if (!canSwitchToOrg(identity, orgId)) {
    return NextResponse.json({ ok: false, error: "Cannot impersonate" }, { status: 403 });
  }

  await recordAuditEvent({
    orgId,
    userId: session.user.id,
    action: "ops.impersonate_start",
    meta: {
      orgId,
      orgName: getOrgById(orgId)?.name,
      handle: session.user.handle,
      fromOrgId: session.user.orgId,
    },
  });

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
