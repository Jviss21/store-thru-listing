import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma, dbMode, isDbReady } from "@/lib/db/client";
import { PILOT_ORGS } from "@/lib/orgs";
import { SEED_USERS } from "@/lib/db/seed-data";

/** List orgs — DB when seeded, else pilot catalog. Ops sees all; members see memberships. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let orgs = PILOT_ORGS.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    region: o.region,
    type: o.type,
    flags: o.flags,
  }));

  if (isDbReady() && prisma) {
    try {
      const rows = await prisma.organization.findMany({ orderBy: { name: "asc" } });
      if (rows.length > 0) {
        orgs = rows.map((r) => {
          const seed = PILOT_ORGS.find((p) => p.id === r.id);
          return {
            id: r.id,
            name: r.name,
            slug: r.slug,
            region: r.region ?? seed?.region ?? "",
            type: r.type as "goodwill" | "resale",
            flags: seed?.flags ?? {
              autoList: true,
              shopgoodwill: true,
              ebay: true,
              killSwitchOff: true,
            },
          };
        });
      }
    } catch {
      // keep seed catalog
    }
  }

  if (!session.user.isOps) {
    const allowed = new Set(session.user.membershipOrgIds);
    orgs = orgs.filter((o) => allowed.has(o.id));
  }

  return NextResponse.json({
    ok: true,
    data: orgs,
    meta: {
      dbMode: dbMode(),
      seedUserCount: SEED_USERS.length,
    },
  });
}
