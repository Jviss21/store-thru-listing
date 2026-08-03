/**
 * Auth helpers — credentials against Prisma User rows when DB is ready,
 * otherwise against the in-code seed user catalog (Vercel-safe).
 */

import bcrypt from "bcryptjs";
import { DEFAULT_DEMO_PASSWORD, resolvedDemoPassword } from "@/lib/demo-auth";
import { prisma, isDbReady } from "@/lib/db/client";
import {
  findSeedUserByEmail,
  SEED_USERS,
  type SeedUser,
  roleForOrg,
} from "@/lib/db/seed-data";
import { PILOT_ORGS, getOrgById, DEFAULT_ORG_ID } from "@/lib/orgs";

export type AuthIdentity = {
  userId: string;
  email: string;
  name: string;
  handle: string;
  isOps: boolean;
  orgId: string;
  role: string;
  /** Org ids the user may switch into */
  membershipOrgIds: string[];
};

/** Pilot password: DEMO_PASSWORD env, else testgoodwill. All seeded users share it. */
export function pilotPassword(): string {
  return resolvedDemoPassword() || DEFAULT_DEMO_PASSWORD;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

function seedToIdentity(user: SeedUser, orgId?: string): AuthIdentity {
  const active =
    orgId && (user.isOps || user.memberships.some((m) => m.orgId === orgId))
      ? orgId
      : user.primaryOrgId;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    handle: user.handle,
    isOps: user.isOps,
    orgId: active,
    role: roleForOrg(user, active),
    membershipOrgIds: user.isOps
      ? PILOT_ORGS.map((o) => o.id)
      : user.memberships.map((m) => m.orgId),
  };
}

async function identityFromDb(
  email: string,
  password: string
): Promise<AuthIdentity | null> {
  if (!prisma) return null;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { memberships: true },
  });
  if (!user) return null;

  // Prefer bcrypt hash; also accept live pilot password (env may change without reseed)
  const hashOk = await verifyPassword(password, user.passwordHash);
  const pilotOk = password === pilotPassword();
  if (!hashOk && !pilotOk) return null;

  const membershipOrgIds = user.isOps
    ? PILOT_ORGS.map((o) => o.id)
    : user.memberships.filter((m) => m.status === "Active").map((m) => m.orgId);

  const orgId =
    membershipOrgIds.find((id) => id === DEFAULT_ORG_ID) ??
    membershipOrgIds[0] ??
    DEFAULT_ORG_ID;
  const role =
    user.memberships.find((m) => m.orgId === orgId)?.role ??
    (user.isOps ? "Admin" : "Viewer");

  const handle =
    user.email.split("@")[0]?.replace(/[^a-z0-9]/gi, "").slice(0, 12) || "user";

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    handle,
    isOps: user.isOps,
    orgId,
    role,
    membershipOrgIds,
  };
}

/**
 * Validate email + password. Returns identity or null.
 * Password-only: pass empty email to default to Test Goodwill John Doe
 * when password matches pilot password (share-link friendly).
 */
export async function authenticateCredentials(
  email: string | undefined,
  password: string
): Promise<AuthIdentity | null> {
  const pwd = password.trim();
  if (!pwd) return null;

  const normalizedEmail = (email ?? "").trim().toLowerCase();

  // Share-link path: password alone → Test Goodwill default user
  if (!normalizedEmail) {
    if (pwd !== pilotPassword()) return null;
    const def = findSeedUserByEmail("john.doe@testgoodwill.example");
    return def ? seedToIdentity(def) : null;
  }

  if (isDbReady()) {
    try {
      const fromDb = await identityFromDb(normalizedEmail, pwd);
      if (fromDb) return fromDb;
    } catch {
      // fall through to seed
    }
  }

  const seed = findSeedUserByEmail(normalizedEmail);
  if (!seed) return null;
  if (pwd !== pilotPassword()) return null;
  return seedToIdentity(seed);
}

export function listSeedIdentities(): AuthIdentity[] {
  return SEED_USERS.map((u) => seedToIdentity(u));
}

export function orgsForIdentity(identity: AuthIdentity) {
  const ids = identity.isOps
    ? PILOT_ORGS.map((o) => o.id)
    : identity.membershipOrgIds;
  return ids.map((id) => getOrgById(id)).filter(Boolean);
}

export function canSwitchToOrg(identity: AuthIdentity, orgId: string): boolean {
  if (identity.isOps) return Boolean(getOrgById(orgId));
  return identity.membershipOrgIds.includes(orgId);
}
