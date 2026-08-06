import { NextRequest, NextResponse } from "next/server";
import { acceptInvite, getInviteByToken } from "@/lib/db/invites";
import { dbMode, isDbReady } from "@/lib/db/client";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: { token: string } };

/** Public: fetch invite metadata for accept page. */
export async function GET(request: NextRequest, { params }: Params) {
  const ip = clientIp(request);
  const rl = rateLimit(`invite-get:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  if (!isDbReady()) {
    return NextResponse.json(
      { ok: false, error: "Database unavailable", dbMode: dbMode() },
      { status: 503 }
    );
  }
  const invite = await getInviteByToken(params.token);
  if (!invite) {
    return NextResponse.json({ ok: false, error: "Invite not found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    data: {
      email: invite.email,
      role: invite.role,
      orgId: invite.orgId,
      orgName: invite.orgName,
      status: invite.status,
      expiresAt: invite.expiresAt,
    },
  });
}

/** Public: accept invite — set password, create/update user + membership. */
export async function POST(request: NextRequest, { params }: Params) {
  const ip = clientIp(request);
  const rl = rateLimit(`invite-accept:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${rl.retryAfterSec}s.` },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      }
    );
  }

  if (!isDbReady()) {
    return NextResponse.json(
      { ok: false, error: "Database unavailable", dbMode: dbMode() },
      { status: 503 }
    );
  }

  let body: { name?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await acceptInvite({
    token: params.token,
    name: body.name ?? "",
    password: body.password ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      email: result.email,
      orgId: result.orgId,
      role: result.role,
    },
    message: "Invite accepted. You can sign in with your email and password.",
  });
}
