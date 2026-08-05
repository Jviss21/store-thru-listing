/**
 * Domain data access barrel + prefer-DB helper.
 */

import { isDbReady } from "@/lib/db/client";

export { prisma, isDbReady, isDbConfigured, dbMode } from "@/lib/db/client";
export * from "@/lib/db/products";
export * from "@/lib/db/manifests";
export * from "@/lib/db/invites";
export * from "@/lib/db/org-settings";

/** Prefer writing domain rows to Postgres when session has orgId and DB is ready. */
export function preferDbWrites(orgId: string | null | undefined): boolean {
  return Boolean(orgId?.trim()) && isDbReady();
}
