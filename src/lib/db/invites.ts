/**
 * Invite repository — create / list pending / accept (User + Membership).
 * Raw invite tokens are returned only at create time; DB stores SHA-256 hashes.
 */

import { randomBytes } from "crypto";
import { prisma, isDbReady } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/credentials";
import type { InviteRole } from "@/lib/db/api-auth";
import {
  hashInviteToken,
  newInviteToken,
  tokenLogSuffix,
} from "@/lib/invite-token";
import { validatePassword } from "@/lib/password-policy";
import { recordAuditEvent } from "@/lib/db/audit";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type InviteDto = {
  id: string;
  orgId: string;
  email: string;
  role: string;
  /** Omitted in list responses when token is hashed at rest. */
  token?: string;
  expiresAt: string;
  invitedById: string | null;
  acceptedAt: string | null;
  createdAt: string;
  /** Only set when raw token is known (create / resend). */
  inviteUrl?: string;
};

function toDto(
  row: {
    id: string;
    orgId: string;
    email: string;
    role: string;
    token: string;
    expiresAt: Date;
    invitedById: string | null;
    acceptedAt: Date | null;
    createdAt: Date;
  },
  opts?: { baseUrl?: string; rawToken?: string }
): InviteDto {
  const dto: InviteDto = {
    id: row.id,
    orgId: row.orgId,
    email: row.email,
    role: row.role,
    expiresAt: row.expiresAt.toISOString(),
    invitedById: row.invitedById,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
  if (opts?.rawToken) {
    dto.token = opts.rawToken;
    if (opts.baseUrl) {
      dto.inviteUrl = `${opts.baseUrl.replace(/\/$/, "")}/invite/${opts.rawToken}`;
    }
  }
  return dto;
}

export { newInviteToken };

export async function createInvite(opts: {
  orgId: string;
  email: string;
  role: InviteRole;
  invitedById?: string | null;
  baseUrl?: string;
}): Promise<InviteDto | null> {
  if (!isDbReady() || !prisma) return null;
  const email = opts.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  try {
    // Expire any prior pending invites for same org+email
    await prisma.invite.updateMany({
      where: {
        orgId: opts.orgId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    const rawToken = newInviteToken();
    const tokenHash = hashInviteToken(rawToken);
    const row = await prisma.invite.create({
      data: {
        orgId: opts.orgId,
        email,
        role: opts.role,
        token: tokenHash,
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        invitedById: opts.invitedById ?? null,
      },
    });

    const dto = toDto(row, { baseUrl: opts.baseUrl, rawToken });
    console.info("[invite] created", {
      email: dto.email,
      orgId: dto.orgId,
      role: dto.role,
      tokenSuffix: tokenLogSuffix(rawToken),
      expiresAt: dto.expiresAt,
    });
    await prisma.auditEvent.create({
      data: {
        orgId: dto.orgId,
        userId: opts.invitedById ?? null,
        action: "invite.created",
        metaJson: JSON.stringify({
          email: dto.email,
          role: dto.role,
          expiresAt: dto.expiresAt,
        }),
      },
    }).catch(() => {
      /* non-fatal */
    });
    return dto;
  } catch (e) {
    console.error("[invite] create failed", e);
    return null;
  }
}

export async function listPendingInvites(
  orgId: string
): Promise<InviteDto[] | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const rows = await prisma.invite.findMany({
      where: {
        orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    // Hashed at rest — no rebuildable inviteUrl; UI uses Resend to mint a new link.
    return rows.map((r) => toDto(r));
  } catch {
    return null;
  }
}

async function findInviteRowByRawToken(rawToken: string) {
  if (!prisma) return null;
  const tokenHash = hashInviteToken(rawToken);
  const byHash = await prisma.invite.findUnique({
    where: { token: tokenHash },
    include: { org: true },
  });
  if (byHash) return byHash;

  // Legacy plaintext tokens (pre-hash deploy) — still honor until expiry
  const byPlain = await prisma.invite.findUnique({
    where: { token: rawToken },
    include: { org: true },
  });
  return byPlain;
}

export async function getInviteByToken(token: string): Promise<
  | (InviteDto & {
      orgName: string;
      status: "pending" | "accepted" | "expired";
    })
  | null
> {
  if (!isDbReady() || !prisma) return null;
  try {
    const row = await findInviteRowByRawToken(token);
    if (!row) return null;
    let status: "pending" | "accepted" | "expired" = "pending";
    if (row.acceptedAt) status = "accepted";
    else if (row.expiresAt.getTime() < Date.now()) status = "expired";
    return {
      ...toDto(row),
      orgName: row.org.name,
      status,
    };
  } catch {
    return null;
  }
}

export type AcceptInviteResult =
  | { ok: true; userId: string; email: string; orgId: string; role: string }
  | { ok: false; error: string };

export async function acceptInvite(opts: {
  token: string;
  name: string;
  password: string;
}): Promise<AcceptInviteResult> {
  if (!isDbReady() || !prisma) {
    return { ok: false, error: "Database unavailable" };
  }
  const name = opts.name.trim();
  const password = opts.password;
  if (name.length < 2) return { ok: false, error: "Name is required" };
  const pwd = validatePassword(password);
  if (!pwd.ok) return { ok: false, error: pwd.error };

  try {
    const invite = await findInviteRowByRawToken(opts.token);
    if (!invite) return { ok: false, error: "Invite not found" };
    if (invite.acceptedAt) return { ok: false, error: "Invite already accepted" };
    if (invite.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: "Invite has expired" };
    }

    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    let userId: string;
    if (existing) {
      userId = existing.id;
      await prisma.user.update({
        where: { id: existing.id },
        data: { name, passwordHash },
      });
      await prisma.membership.upsert({
        where: { orgId_userId: { orgId: invite.orgId, userId: existing.id } },
        create: {
          orgId: invite.orgId,
          userId: existing.id,
          role: invite.role,
          status: "Active",
        },
        update: { role: invite.role, status: "Active" },
      });
    } else {
      userId = `user-${randomBytes(8).toString("hex")}`;
      await prisma.user.create({
        data: {
          id: userId,
          email: invite.email,
          name,
          passwordHash,
          isOps: false,
          memberships: {
            create: {
              orgId: invite.orgId,
              role: invite.role,
              status: "Active",
            },
          },
        },
      });
    }

    // Single-use: mark accepted (cannot be reused)
    await prisma.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await recordAuditEvent({
      orgId: invite.orgId,
      userId,
      action: "invite.accepted",
      meta: { email: invite.email, role: invite.role },
    });

    return {
      ok: true,
      userId,
      email: invite.email,
      orgId: invite.orgId,
      role: invite.role,
    };
  } catch (e) {
    console.error("[invite] accept failed", e);
    return { ok: false, error: "Could not accept invite" };
  }
}

export async function getOrgName(orgId: string): Promise<string | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    return org?.name ?? null;
  } catch {
    return null;
  }
}
