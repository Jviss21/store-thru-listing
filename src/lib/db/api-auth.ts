/**
 * Shared API session helpers for org-scoped domain routes.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { isAdminCapable } from "@/lib/roles";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  handle: string;
  orgId: string;
  role: string;
  isOps: boolean;
  membershipOrgIds: string[];
};

export async function requireSession(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: session.user as SessionUser };
}

export function assertOrgAccess(
  user: SessionUser,
  orgId: string
): NextResponse | null {
  if (user.isOps) return null;
  if (user.membershipOrgIds.includes(orgId) || user.orgId === orgId) return null;
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

export function assertCanManageUsers(user: SessionUser): NextResponse | null {
  if (user.isOps || isAdminCapable(user.role)) return null;
  return NextResponse.json(
    { ok: false, error: "Admin or Ops Lead required" },
    { status: 403 }
  );
}

export const INVITE_ROLES = [
  "Admin",
  "Ops Lead",
  "Lister",
  "Photographer",
  "Viewer",
] as const;

export type InviteRole = (typeof INVITE_ROLES)[number];

export function isInviteRole(role: string): role is InviteRole {
  return (INVITE_ROLES as readonly string[]).includes(role);
}
