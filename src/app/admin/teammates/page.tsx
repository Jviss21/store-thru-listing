"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { useOrg } from "@/components/OrgProvider";
import type { AdminRole } from "@/lib/admin-data";
import { relativeTime } from "@/lib/utils";

const ROLES: AdminRole[] = ["Admin", "Ops Lead", "Lister", "Photographer", "Viewer"];

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  inviteUrl?: string;
};

type EmailStatus = {
  emailSent: boolean;
  emailMessage: string;
};

export default function AdminTeammatesPage() {
  const { org } = useOrg();
  const { state, persist, ready, saved } = useAdminIms();
  const [tab, setTab] = useState<"active" | "inactive" | "pending">("active");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("Lister");
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastEmailStatus, setLastEmailStatus] = useState<EmailStatus | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/invites?orgId=${encodeURIComponent(org.id)}`);
      const json = (await res.json()) as {
        ok?: boolean;
        data?: PendingInvite[];
        emailConfigured?: boolean;
      };
      if (json.ok && Array.isArray(json.data)) setPending(json.data);
      if (typeof json.emailConfigured === "boolean") {
        setEmailConfigured(json.emailConfigured);
      }
    } catch {
      /* demo resilience */
    }
  }, [org.id]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const rows = useMemo(() => {
    if (!state) return [];
    return state.teammates.filter((t) =>
      tab === "active"
        ? t.loginEnabled && t.status !== "Deactivated"
        : tab === "inactive"
          ? !t.loginEnabled || t.status === "Deactivated"
          : false
    );
  }, [state, tab]);

  async function sendInvite(forEmail?: string, forRole?: AdminRole) {
    const email = (forEmail ?? inviteEmail).trim();
    const role = forRole ?? inviteRole;
    if (!email) return;
    setInviteBusy(true);
    setInviteError(null);
    setCopied(false);
    setLastEmailStatus(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, orgId: org.id }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        inviteUrl?: string;
        emailSent?: boolean;
        emailMessage?: string;
        emailConfigured?: boolean;
        data?: PendingInvite & { id?: string };
      };
      if (!json.ok) {
        setInviteError(json.error || "Could not create invite");
        setInviteBusy(false);
        return;
      }
      if (typeof json.emailConfigured === "boolean") {
        setEmailConfigured(json.emailConfigured);
      }
      const url = json.inviteUrl || json.data?.inviteUrl || null;
      setLastInviteUrl(url);
      setLastEmailStatus({
        emailSent: Boolean(json.emailSent),
        emailMessage:
          json.emailMessage ||
          (json.emailSent
            ? "Invite email sent."
            : "Email not configured — copy the invite link."),
      });
      if (!forEmail) setInviteEmail("");
      await loadPending();
      setTab("pending");

      if (state) {
        const handle =
          email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
        persist(
          {
            ...state,
            teammates: [
              {
                id: json.data?.id ?? `u-${Date.now()}`,
                name: handle,
                email,
                handle,
                role,
                status: "Invited",
                lastActiveAt: new Date().toISOString(),
                online: false,
                supplierId: null,
                sgwUsername: handle,
                sgwPasswordSet: false,
                loginEnabled: true,
                mfaEnabled: false,
                passwordHintSet: false,
              },
              ...state.teammates.filter((t) => t.email.toLowerCase() !== email.toLowerCase()),
            ],
          },
          { action: "Invited teammate", resource: email }
        );
      }
    } catch {
      setInviteError("Network error creating invite");
    }
    setInviteBusy(false);
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setInviteError("Could not copy — select the link manually");
    }
  }

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const activeCount = state.teammates.filter(
    (t) => t.loginEnabled && t.status !== "Deactivated"
  ).length;
  const inactiveCount = state.teammates.length - activeCount;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Teammates"]} />
      <AdminPageIntro
        title="Teammates"
        description="Invite teammates by email with a role. They set their own password on the accept link — no shared password for new users."
        actions={
          <Link href="/admin/roles" className="text-sm font-semibold text-ink underline-offset-2 hover:underline">
            Manage Roles
          </Link>
        }
      />
      {saved ? <p className="text-sm text-mustard">Saved.</p> : null}

      <SectionCard>
        <h2 className="mb-3 text-sm font-semibold text-ink">Invite teammate</h2>
        {emailConfigured === false ? (
          <p className="mb-3 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Email delivery is not configured on this server. Invites still create a one-time link
            you can copy. To send real email, set <code className="font-mono">RESEND_API_KEY</code>{" "}
            and <code className="font-mono">EMAIL_FROM</code> in Vercel /{" "}
            <code className="font-mono">.env.local</code>.
          </p>
        ) : null}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="email@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <SelectField
            className="sm:w-40"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>
          <Button type="button" disabled={inviteBusy || !inviteEmail.trim()} onClick={() => void sendInvite()}>
            {inviteBusy ? "Sending…" : "Send invite"}
          </Button>
        </div>
        {inviteError ? <p className="mb-3 text-sm text-red-700">{inviteError}</p> : null}
        {lastInviteUrl && lastEmailStatus ? (
          <div
            className={`mb-4 rounded-lg border px-3 py-3 text-sm ${
              lastEmailStatus.emailSent
                ? "border-emerald-300/80 bg-emerald-50"
                : "border-amber-300/80 bg-amber-50"
            }`}
          >
            <p className="font-semibold text-ink">
              {lastEmailStatus.emailSent ? "Email sent" : "Email not sent — copy link"}
            </p>
            <p className="mt-1 text-xs text-ink/80">{lastEmailStatus.emailMessage}</p>
            <p className="mt-2 break-all font-mono text-xs text-ink">{lastInviteUrl}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void copyLink(lastInviteUrl)}
            >
              {copied ? "Copied" : "Copy invite link"}
            </Button>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-4 border-b border-ink/10">
          {(
            [
              ["active", `Active teammates (${activeCount})`],
              ["pending", `Pending invites (${pending.length})`],
              ["inactive", `Inactive teammates (${inactiveCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-1 pb-2 text-sm font-semibold ${
                tab === key ? "border-accent text-ink" : "border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "pending" ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-semibold">Email</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Expires</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-muted">
                    No pending invites.
                  </td>
                </tr>
              ) : (
                pending.map((inv) => (
                  <tr key={inv.id} className="border-t border-ink/5 odd:bg-mist/30">
                    <td className="py-2.5 font-medium text-ink">{inv.email}</td>
                    <td className="py-2.5">{inv.role}</td>
                    <td className="py-2.5 text-muted">{relativeTime(inv.expiresAt)}</td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        disabled={inviteBusy}
                        className="text-sm font-semibold text-ink underline-offset-2 hover:underline disabled:opacity-50"
                        onClick={() => void sendInvite(inv.email, inv.role as AdminRole)}
                      >
                        Resend invite
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-semibold">Username</th>
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">Last login</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-ink/5 odd:bg-mist/30">
                  <td className="py-2.5">
                    <span className="font-mono text-xs text-ink">{t.handle}</span>
                    {t.status === "Invited" ? (
                      <Badge className="ml-2" tone="yellow">
                        Invited
                      </Badge>
                    ) : null}
                  </td>
                  <td className="py-2.5 font-medium text-ink">{t.name}</td>
                  <td className="py-2.5 text-muted">{relativeTime(t.lastActiveAt)}</td>
                  <td className="py-2.5">{t.role}</td>
                  <td className="py-2.5">
                    <Link
                      href={`/admin/teammates/${t.id}`}
                      className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
