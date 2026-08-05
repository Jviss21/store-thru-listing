import { NextRequest, NextResponse } from "next/server";
import {
  assertCanManageUsers,
  assertOrgAccess,
  isInviteRole,
  requireSession,
} from "@/lib/db/api-auth";
import { createInvite, listPendingInvites } from "@/lib/db/invites";
import { dbMode, isDbReady } from "@/lib/db/client";

function appBaseUrl(request: NextRequest): string {
  const env = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (env) {
    return env.startsWith("http") ? env : `https://${env}`;
  }
  return request.nextUrl.origin;
}

/** List pending invites for the active (or requested) org. */
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const orgId =
    request.nextUrl.searchParams.get("orgId")?.trim() || auth.user.orgId;
  const forbidden = assertOrgAccess(auth.user, orgId);
  if (forbidden) return forbidden;
  const manage = assertCanManageUsers(auth.user);
  if (manage) return manage;

  if (!isDbReady()) {
    return NextResponse.json({
      ok: true,
      source: "unavailable",
      dbMode: dbMode(),
      data: [],
      message: "Invites require Postgres (DATABASE_URL).",
    });
  }

  const data = await listPendingInvites(orgId, appBaseUrl(request));
  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: data ?? [],
  });
}

/** Create invite (Admin / Ops Lead). Returns copyable invite link. */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const manage = assertCanManageUsers(auth.user);
  if (manage) return manage;

  let body: { email?: string; role?: string; orgId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.orgId?.trim() || auth.user.orgId).trim();
  const forbidden = assertOrgAccess(auth.user, orgId);
  if (forbidden) return forbidden;

  const email = (body.email ?? "").trim().toLowerCase();
  const role = (body.role ?? "Lister").trim();
  if (!email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
  }
  if (!isInviteRole(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
  }

  if (!isDbReady()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invites require Postgres. Set DATABASE_URL and run db push/seed.",
        dbMode: dbMode(),
      },
      { status: 503 }
    );
  }

  const invite = await createInvite({
    orgId,
    email,
    role,
    invitedById: auth.user.id,
    baseUrl: appBaseUrl(request),
  });

  if (!invite) {
    return NextResponse.json({ ok: false, error: "Could not create invite" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: invite,
    /** Explicit copyable link for Admin UI (email is stubbed/logged only). */
    inviteUrl: invite.inviteUrl,
  });
}
