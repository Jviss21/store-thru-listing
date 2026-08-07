import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { recordAuditEvent } from "@/lib/db/audit";
import { dbMode, isDbReady } from "@/lib/db/client";
import { DEFAULT_ORG_ID, getOrgById } from "@/lib/orgs";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type AuditBody = {
  section?: string;
  action?: string;
  resource?: string;
  resourceHref?: string;
  detail?: string;
  entityId?: string;
  orgId?: string;
  user?: string;
  userName?: string;
  at?: string;
};

/**
 * Dual-write bridge: client `logEvent()` posts here so durable AuditEvent rows
 * land in Postgres when Neon is ready. Failures are non-fatal (200 with skipped).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rl = rateLimit(`audit-post:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many audit writes. Retry in ${rl.retryAfterSec}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as AuditBody;
  const action = (body.action || "").trim();
  if (!action) {
    return NextResponse.json({ ok: false, error: "action required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const orgIdRaw = (body.orgId || session?.user?.orgId || DEFAULT_ORG_ID).trim();
  const orgId = getOrgById(orgIdRaw)?.id ?? DEFAULT_ORG_ID;

  if (!isDbReady()) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "db_unavailable",
      dbMode: dbMode(),
    });
  }

  const persisted = await recordAuditEvent({
    orgId,
    userId: session?.user?.id ?? null,
    action: body.section ? `${body.section}.${action}` : action,
    meta: {
      section: body.section,
      resource: body.resource,
      resourceHref: body.resourceHref,
      detail: body.detail,
      entityId: body.entityId,
      user: body.user || session?.user?.handle || session?.user?.email,
      userName: body.userName || session?.user?.name,
      at: body.at || new Date().toISOString(),
      source: "logEvent",
    },
  });

  return NextResponse.json({
    ok: true,
    persisted,
    dbMode: dbMode(),
  });
}
