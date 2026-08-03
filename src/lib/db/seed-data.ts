/**
 * Canonical pilot seed — used by Prisma seed script AND Auth.js fallback
 * when DATABASE_URL / Prisma is unavailable (e.g. Vercel without Postgres).
 */

import { PILOT_ORGS, DEFAULT_ORG_ID } from "@/lib/orgs";

export const PILOT_PASSWORD = "testgoodwill";
export const OPS_EMAIL = "ops@hammoq.example";
export const OPS_USER_ID = "user-ops-hammoq";

export type SeedMembership = {
  orgId: string;
  role: "Admin" | "Ops Lead" | "Lister" | "Photographer" | "Viewer";
};

export type SeedUser = {
  id: string;
  email: string;
  name: string;
  handle: string;
  isOps: boolean;
  /** Primary org for default session */
  primaryOrgId: string;
  memberships: SeedMembership[];
};

function adminEmailForSlug(slug: string): string {
  return `admin@${slug}.example`;
}

/** One admin user per pilot org + Hammoq ops user. */
export function buildSeedUsers(): SeedUser[] {
  const orgUsers: SeedUser[] = PILOT_ORGS.map((org, i) => {
    const isTestGw = org.id === DEFAULT_ORG_ID;
    return {
      id: `user-${org.slug}`,
      email: isTestGw ? "john.doe@testgoodwill.example" : adminEmailForSlug(org.slug),
      name: isTestGw ? "John Doe" : `${org.name.split(" ")[0]} Admin`,
      handle: isTestGw ? "jdoe" : `admin${i}`,
      isOps: false,
      primaryOrgId: org.id,
      memberships: [{ orgId: org.id, role: isTestGw ? "Ops Lead" : "Admin" }],
    };
  });

  const ops: SeedUser = {
    id: OPS_USER_ID,
    email: OPS_EMAIL,
    name: "Hammoq Ops",
    handle: "ops",
    isOps: true,
    primaryOrgId: DEFAULT_ORG_ID,
    memberships: PILOT_ORGS.map((o) => ({
      orgId: o.id,
      role: "Admin" as const,
    })),
  };

  return [...orgUsers, ops];
}

export const SEED_USERS = buildSeedUsers();

export function findSeedUserByEmail(email: string): SeedUser | undefined {
  const normalized = email.trim().toLowerCase();
  return SEED_USERS.find((u) => u.email.toLowerCase() === normalized);
}

export function membershipOrgIds(user: SeedUser): string[] {
  return user.memberships.map((m) => m.orgId);
}

export function roleForOrg(user: SeedUser, orgId: string): string {
  return user.memberships.find((m) => m.orgId === orgId)?.role ?? "Viewer";
}
