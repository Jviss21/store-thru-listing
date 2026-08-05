/**
 * OrgSettings repository — Admin IMS JSON blob in Postgres.
 */

import { prisma, isDbReady } from "@/lib/db/client";

export async function getOrgSettingsJson(orgId: string): Promise<unknown | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const row = await prisma.orgSettings.findUnique({ where: { orgId } });
    if (!row?.adminImsJson) return null;
    return JSON.parse(row.adminImsJson) as unknown;
  } catch {
    return null;
  }
}

export async function upsertOrgSettingsJson(opts: {
  orgId: string;
  adminIms: unknown;
  updatedById?: string | null;
}): Promise<boolean> {
  if (!isDbReady() || !prisma) return false;
  try {
    const adminImsJson = JSON.stringify(opts.adminIms ?? {});
    await prisma.orgSettings.upsert({
      where: { orgId: opts.orgId },
      create: {
        orgId: opts.orgId,
        adminImsJson,
        updatedById: opts.updatedById ?? null,
      },
      update: {
        adminImsJson,
        updatedById: opts.updatedById ?? null,
      },
    });
    return true;
  } catch (e) {
    console.error("[org-settings] upsert failed", e);
    return false;
  }
}
