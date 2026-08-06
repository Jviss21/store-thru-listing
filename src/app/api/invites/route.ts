import { NextRequest, NextResponse } from "next/server";
import {
  assertCanManageUsers,
  assertOrgAccess,
  isInviteRole,
  requireSession,
} from "@/lib/db/api-auth";
import { createInvite, getOrgName, listPendingInvites } from "@/lib/db/invites";
import { dbMode, isDbReady } from "@/lib/db/client";
import {
  emailConfigStatus,
  sendInviteEmail,
  type EmailSendResult,
} from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function appBaseUrl(request: NextRequest): string {
  const env = process.env.NEXTAUTH_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (env) {
    return env.startsWith("http") ? env : `https://${env}`;
  }
  return request.nextUrl.origin;
}

function emailStatusPayload(result: EmailSendResult) {
  if (result.sent) {
    return {
      emailSent: true as const,
      emailProvider: result.provider,
      emailMessage: "Invite email sent.",
    };
  }
  if (result.reason === "not_configured") {
    return {
      emailSent: false as const,
      emailProvider: null,
      emailMessage:
        "Email not configured — copy the invite link and share it manually. Set RESEND_API_KEY + EMAIL_FROM (or SMTP_*) on the server.",
    };
  }
  return {
    emailSent: false as const,
    emailProvider: null,
    emailMessage: `Invite created, but email failed to send${
      result.error ? `: ${result.error}` : ""
    }. Copy the link and share it manually.`,
  };
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
      emailConfigured: isEmailConfiguredFlag(),
      message: "Invites require Postgres (DATABASE_URL).",
    });
  }

  const data = await listPendingInvites(orgId);
  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: data ?? [],
    emailConfigured: isEmailConfiguredFlag(),
    emailProvider: emailConfigStatus().provider,
  });
}

function isEmailConfiguredFlag(): boolean {
  return emailConfigStatus().configured;
}

/** Create invite (Admin / Ops Lead). Sends email when configured; always returns copyable link. */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const manage = assertCanManageUsers(auth.user);
  if (manage) return manage;

  const ip = clientIp(request);
  const rl = rateLimit(`invite-create:${auth.user.id}:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Too many invites. Try again in ${rl.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

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

  if (!invite || !invite.inviteUrl) {
    return NextResponse.json({ ok: false, error: "Could not create invite" }, { status: 500 });
  }

  const orgName =
    (await getOrgName(orgId)) ||
    auth.user.orgId ||
    "your organization";

  const sendResult = await sendInviteEmail({
    to: email,
    orgName,
    role,
    inviteUrl: invite.inviteUrl,
    expiresAt: invite.expiresAt,
    invitedByName: auth.user.name,
  });

  const emailStatus = emailStatusPayload(sendResult);

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: {
      id: invite.id,
      orgId: invite.orgId,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      invitedById: invite.invitedById,
      acceptedAt: invite.acceptedAt,
      createdAt: invite.createdAt,
      inviteUrl: invite.inviteUrl,
    },
    inviteUrl: invite.inviteUrl,
    emailConfigured: isEmailConfiguredFlag(),
    ...emailStatus,
  });
}
