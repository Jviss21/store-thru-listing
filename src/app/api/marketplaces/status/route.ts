import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { listMarketplaceStatuses } from "@/lib/api/marketplaces";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const orgId = new URL(request.url).searchParams.get("orgId")?.trim() || session.user.orgId;
  if (
    !session.user.isOps &&
    !session.user.membershipOrgIds.includes(orgId)
  ) {
    return NextResponse.json({ ok: false, error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  const [sgw, ebay] = listMarketplaceStatuses();
  return NextResponse.json({
    ok: true,
    data: {
      orgId,
      shopgoodwill: {
        configured: sgw.configured,
        missingEnv: sgw.missingEnv,
        mode: sgw.mode,
      },
      ebay: {
        configured: ebay.configured,
        missingEnv: ebay.missingEnv,
        mode: ebay.mode,
      },
    },
  });
}
