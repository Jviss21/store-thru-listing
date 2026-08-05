import { NextRequest, NextResponse } from "next/server";
import {
  assertOrgAccess,
  requireSession,
} from "@/lib/db/api-auth";
import { createManifestWithProducts, listManifestsForOrg } from "@/lib/db/manifests";
import { dbMode, isDbReady, preferDbWrites } from "@/lib/db/domain";

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
      data: [],
    });
  }

  const data = await listManifestsForOrg(orgId);
  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: data ?? [],
  });
}

/** Create donor batch + products in Postgres when available. */
export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  let body: {
    orgId?: string;
    batchBarcode?: string;
    supplier?: string;
    notes?: string;
    lines?: { title: string; sku: string; barcode?: string }[];
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.orgId?.trim() || auth.user.orgId).trim();
  const forbidden = assertOrgAccess(auth.user, orgId);
  if (forbidden) return forbidden;

  const batchBarcode = (body.batchBarcode ?? "").trim();
  const lines = body.lines ?? [];
  if (!batchBarcode) {
    return NextResponse.json(
      { ok: false, error: "batchBarcode required" },
      { status: 400 }
    );
  }
  if (!lines.length) {
    return NextResponse.json(
      { ok: false, error: "At least one line required" },
      { status: 400 }
    );
  }

  if (!preferDbWrites(orgId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Database unavailable — use client mock fallback",
        dbMode: dbMode(),
        fallback: "mock",
      },
      { status: 503 }
    );
  }

  const created = await createManifestWithProducts({
    orgId,
    batchBarcode,
    supplier: body.supplier ?? null,
    notes: body.notes ?? null,
    createdById: auth.user.id,
    lines,
  });

  if (!created) {
    return NextResponse.json(
      { ok: false, error: "Could not create manifest (duplicate SKU or batch?)", fallback: "mock" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: created,
  });
}
