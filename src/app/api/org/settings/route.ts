import { NextRequest, NextResponse } from "next/server";
import {
  assertCanManageUsers,
  assertOrgAccess,
  requireSession,
} from "@/lib/db/api-auth";
import { getOrgSettingsJson, upsertOrgSettingsJson } from "@/lib/db/org-settings";
import { dbMode, isDbReady } from "@/lib/db/client";

/** Read Admin IMS settings JSON for org (Postgres SoR when available). */
export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const orgId =
    request.nextUrl.searchParams.get("orgId")?.trim() || auth.user.orgId;
  const forbidden = assertOrgAccess(auth.user, orgId);
  if (forbidden) return forbidden;

  if (!isDbReady()) {
    return NextResponse.json({
      ok: true,
      source: "unavailable",
      dbMode: dbMode(),
      data: null,
    });
  }

  const data = await getOrgSettingsJson(orgId);
  const hasBlob =
    data != null &&
    typeof data === "object" &&
    Object.keys(data as Record<string, unknown>).length > 0;
  return NextResponse.json({
    ok: true,
    source: hasBlob ? "prisma" : "empty",
    dbMode: dbMode(),
    data: hasBlob ? data : null,
  });
}

/** Persist Admin IMS settings JSON (Admin / Ops Lead). */
export async function PUT(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const manage = assertCanManageUsers(auth.user);
  if (manage) return manage;

  let body: { orgId?: string; adminIms?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.orgId?.trim() || auth.user.orgId).trim();
  const forbidden = assertOrgAccess(auth.user, orgId);
  if (forbidden) return forbidden;

  if (body.adminIms == null || typeof body.adminIms !== "object") {
    return NextResponse.json(
      { ok: false, error: "adminIms object required" },
      { status: 400 }
    );
  }

  if (!isDbReady()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Database unavailable — client may keep localStorage",
        dbMode: dbMode(),
        fallback: "localStorage",
      },
      { status: 503 }
    );
  }

  const ok = await upsertOrgSettingsJson({
    orgId,
    adminIms: body.adminIms,
    updatedById: auth.user.id,
  });

  if (!ok) {
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
  });
}
