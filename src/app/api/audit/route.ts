import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { recordAuditEvent } from "@/lib/db/audit";
import { dbMode, isDbReady } from "@/lib/db/client";
import { DEFAULT_ORG_ID, getOrgById } from "@/lib/orgs";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type AuditBody = {
  id?: string;
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

/** Best-effort forward to Hammoq Backend SoR (POST /api/events). */
function mirrorToHammoqBackend(payload: {
  id?: string;
  at: string;
  orgId: string;
  section?: string;
  action: string;
  resource?: string;
  resourceHref?: string;
  entityId?: string;
  detail?: string;
  user?: string;
  userName?: string;
}) {
  const base = process.env.HAMMOQ_BACKEND_URL?.trim().replace(/\/$/, "");
  const secret = process.env.EVENTS_INGEST_SECRET?.trim();
  if (!base || !secret) return;

  void fetch(`${base}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-events-secret": secret,
    },
    body: JSON.stringify({
      ...payload,
      origin: "ims",
    }),
    keepalive: true,
  }).catch(() => {
    /* Backend ingest is best-effort; IMS AuditEvent remains local SoR trail */
  });
}

/**
 * Dual-write bridge: client `logEvent()` posts here so durable AuditEvent rows
 * land in Postgres when Neon is ready. When HAMMOQ_BACKEND_URL + EVENTS_INGEST_SECRET
 * are set, also forwards to Backend Admin POST /api/events. Failures are non-fatal.
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
  const at = body.at || new Date().toISOString();
  const user =
    body.user || session?.user?.handle || session?.user?.email || undefined;
  const userName = body.userName || session?.user?.name || undefined;

  mirrorToHammoqBackend({
    id: body.id,
    at,
    orgId,
    section: body.section,
    action,
    resource: body.resource,
    resourceHref: body.resourceHref,
    entityId: body.entityId,
    detail: body.detail,
    user,
    userName,
  });

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
      id: body.id,
      section: body.section,
      resource: body.resource,
      resourceHref: body.resourceHref,
      detail: body.detail,
      entityId: body.entityId,
      user,
      userName,
      at,
      source: "logEvent",
    },
  });

  return NextResponse.json({
    ok: true,
    persisted,
    dbMode: dbMode(),
  });
}
