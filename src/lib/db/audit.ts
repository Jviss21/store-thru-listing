/**
 * Best-effort Postgres audit writes. Never throws to callers — Neon/DB outages
 * must not break product flows. Client UI still uses org-scoped localStorage
 * via `@/lib/event-log`.
 */

import { prisma, isDbReady } from "@/lib/db/client";

export type RecordAuditInput = {
  orgId?: string | null;
  userId?: string | null;
  action: string;
  meta?: Record<string, unknown>;
};

export async function recordAuditEvent(input: RecordAuditInput): Promise<boolean> {
  if (!isDbReady() || !prisma) return false;
  try {
    await prisma.auditEvent.create({
      data: {
        orgId: input.orgId || null,
        userId: input.userId || null,
        action: input.action,
        metaJson: input.meta ? JSON.stringify(input.meta) : null,
      },
    });
    return true;
  } catch (err) {
    console.warn("[audit] record skipped:", err);
    return false;
  }
}
