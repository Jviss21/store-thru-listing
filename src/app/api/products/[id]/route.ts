import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { dbMode, preferDbWrites } from "@/lib/db/domain";
import { findProductById, updateProduct } from "@/lib/db/products";
import { withStageTag, type WorkflowStageId, WORKFLOW_STAGES } from "@/lib/workflow";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/products/[id] — update tags / stage / location when Postgres is ready.
 * Client demo store remains source of truth when DB is unavailable (returns 200 + source client-only).
 */
export async function PATCH(request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: productId } = await ctx.params;
  if (!productId) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  let body: {
    orgId?: string;
    tags?: string[];
    stage?: string;
    location?: string;
    status?: string;
    title?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = (body.orgId?.trim() || session.user.orgId).trim();
  if (!session.user.isOps && !session.user.membershipOrgIds.includes(orgId)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let tags = body.tags;
  if (body.stage) {
    const stage = body.stage as WorkflowStageId;
    if (!WORKFLOW_STAGES.some((s) => s.id === stage)) {
      return NextResponse.json({ ok: false, error: "Invalid stage" }, { status: 400 });
    }
    tags = withStageTag(tags ?? [], stage);
  }

  if (!preferDbWrites(orgId)) {
    return NextResponse.json({
      ok: true,
      source: "client-only",
      dbMode: dbMode(),
      data: { id: productId, tags: tags ?? null, stage: body.stage ?? null },
    });
  }

  const existing = await findProductById(orgId, productId);
  if (!existing) {
    // Product may only exist in browser demo store — don't fail Neon/demo hybrid.
    return NextResponse.json({
      ok: true,
      source: "client-only",
      dbMode: dbMode(),
      data: { id: productId, tags: tags ?? null, stage: body.stage ?? null },
    });
  }

  const updated = await updateProduct(orgId, productId, {
    tags: tags ?? existing.tags,
    location: body.location ?? undefined,
    status: body.status ?? undefined,
    title: body.title ?? undefined,
  });

  if (!updated) {
    return NextResponse.json({
      ok: true,
      source: "client-only",
      dbMode: dbMode(),
      data: { id: productId, tags: tags ?? null },
    });
  }

  return NextResponse.json({
    ok: true,
    source: "prisma",
    dbMode: dbMode(),
    data: updated,
  });
}

export async function GET(_request: NextRequest, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id: productId } = await ctx.params;
  const orgId = session.user.orgId;
  if (!preferDbWrites(orgId)) {
    return NextResponse.json({ ok: true, source: "none", data: null });
  }
  const row = await findProductById(orgId, productId);
  return NextResponse.json({
    ok: true,
    source: row ? "prisma" : "none",
    data: row,
  });
}
