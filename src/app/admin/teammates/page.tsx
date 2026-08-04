"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import type { AdminRole } from "@/lib/admin-data";
import { relativeTime } from "@/lib/utils";

const ROLES: AdminRole[] = ["Admin", "Ops Lead", "Lister", "Photographer", "Viewer"];

export default function AdminTeammatesPage() {
  const { state, persist, ready, saved } = useAdminIms();
  const [tab, setTab] = useState<"active" | "inactive">("active");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("Lister");

  const rows = useMemo(() => {
    if (!state) return [];
    return state.teammates.filter((t) =>
      tab === "active" ? t.loginEnabled && t.status !== "Deactivated" : !t.loginEnabled || t.status === "Deactivated"
    );
  }, [state, tab]);

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
        description="Staff accounts for this org. Edit opens the full account form. Roles align with floor auth."
        actions={
          <Link href="/admin/roles" className="text-sm font-semibold text-ink underline-offset-2 hover:underline">
            Manage Roles
          </Link>
        }
      />
      {saved ? <p className="text-sm text-mustard">Saved.</p> : null}

      <SectionCard>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="email@testgoodwill.example"
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
          <Button
            type="button"
            onClick={() => {
              if (!inviteEmail.trim()) return;
              const handle =
                inviteEmail.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "user";
              persist(
                {
                  ...state,
                  teammates: [
                    {
                      id: `u-${Date.now()}`,
                      name: handle,
                      email: inviteEmail.trim(),
                      handle,
                      role: inviteRole,
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
                    ...state.teammates,
                  ],
                },
                { action: "Invited teammate", resource: inviteEmail.trim() }
              );
              setInviteEmail("");
            }}
          >
            Add Teammate
          </Button>
        </div>

        <div className="mb-3 flex gap-4 border-b border-ink/10">
          {(
            [
              ["active", `Active teammates (${activeCount})`],
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
      </SectionCard>
    </div>
  );
}
