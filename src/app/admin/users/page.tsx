"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";
import {
  PERMISSION_LABELS,
  type AdminRole,
  type PermissionKey,
  isAdminCapable,
} from "@/lib/admin-data";
import {
  effectivePermissions,
  loadAdminState,
  saveAdminState,
  type AdminPersistedState,
} from "@/lib/admin-settings";
import { relativeTime } from "@/lib/utils";

const ROLES: AdminRole[] = ["Admin", "Ops Lead", "Lister", "Photographer", "Viewer"];
const PERMS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

export default function AdminUsersPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("Lister");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setState(loadAdminState());
  }, []);

  const acting = useMemo(
    () => state?.users.find((u) => u.id === state.actingAsUserId),
    [state]
  );

  function persist(next: AdminPersistedState, msg?: string) {
    saveAdminState(next);
    setState(next);
    if (msg) {
      setFlash(msg);
      setTimeout(() => setFlash(null), 2200);
    }
  }

  function invite() {
    if (!state || !inviteEmail.trim()) return;
    const handle = inviteEmail.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
    const user = {
      id: `u-${Date.now()}`,
      name: handle,
      email: inviteEmail.trim(),
      handle,
      role: inviteRole,
      status: "Invited" as const,
      lastActiveAt: new Date().toISOString(),
      online: false,
    };
    persist(
      { ...state, users: [user, ...state.users] },
      `Invite queued for ${user.email} (${inviteRole}).`
    );
    setInviteEmail("");
  }

  function setStatus(id: string, status: "Active" | "Deactivated") {
    if (!state) return;
    persist(
      {
        ...state,
        users: state.users.map((u) => (u.id === id ? { ...u, status, online: false } : u)),
      },
      status === "Deactivated" ? "User deactivated (demo)." : "User reactivated (demo)."
    );
  }

  function setRole(id: string, role: AdminRole) {
    if (!state) return;
    persist({
      ...state,
      users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
    });
  }

  function togglePerm(role: AdminRole, key: PermissionKey) {
    if (!state) return;
    const current = effectivePermissions(role, state.permissionOverrides)[key];
    const overrides = {
      ...state.permissionOverrides,
      [role]: {
        ...state.permissionOverrides[role],
        [key]: !current,
      },
    };
    persist({ ...state, permissionOverrides: overrides });
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading users…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Users & roles</h2>
        <p className="mt-1 text-sm text-muted">
          Staff accounts for Test Goodwill. Invite / deactivate are demo actions — nothing leaves this
          browser.
        </p>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Acting as (demo switcher)</p>
          <p className="mt-0.5 text-xs text-muted">
            {acting
              ? `${acting.name} · ${acting.role}${
                  isAdminCapable(acting.role) ? " · admin-capable" : ""
                }`
              : "—"}
          </p>
        </div>
        <select
          className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm"
          value={state.actingAsUserId}
          onChange={(e) => persist({ ...state, actingAsUserId: e.target.value })}
        >
          {state.users
            .filter((u) => u.status !== "Deactivated")
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
        </select>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold text-ink">Invite teammate</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="email@testgoodwill.example"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <select
            className="h-10 rounded-xl border border-ink/10 bg-white px-3 text-sm"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button type="button" onClick={invite}>
            Send invite
          </Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-3 py-2.5 font-semibold">Role</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Last active</th>
              <th className="px-4 py-2.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.users.map((u) => (
              <tr key={u.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        u.online ? "bg-mustard" : "bg-ink/20"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-muted">
                        @{u.handle} · {u.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <select
                    className="h-9 rounded-lg border border-ink/10 bg-white px-2 text-sm"
                    value={u.role}
                    disabled={u.status === "Deactivated"}
                    onChange={(e) => setRole(u.id, e.target.value as AdminRole)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      u.status === "Active" ? "green" : u.status === "Invited" ? "yellow" : "neutral"
                    }
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-muted">{relativeTime(u.lastActiveAt)}</td>
                <td className="px-4 py-3">
                  {u.status === "Deactivated" ? (
                    <Button size="sm" variant="outline" type="button" onClick={() => setStatus(u.id, "Active")}>
                      Reactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setStatus(u.id, "Deactivated")}
                    >
                      Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Role permissions</h3>
        <p className="mt-1 text-sm text-muted">
          Demo matrix — toggles persist locally. Includes {PERMISSION_LABELS.runAutoList}.
        </p>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="px-2 py-2.5 text-center font-semibold">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMS.map((key) => (
              <tr key={key} className="border-b border-ink/5">
                <td className="px-4 py-2.5 font-medium text-ink">{PERMISSION_LABELS[key]}</td>
                {ROLES.map((role) => {
                  const on = effectivePermissions(role, state.permissionOverrides)[key];
                  return (
                    <td key={role} className="px-2 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => togglePerm(role, key)}
                        aria-label={`${role} ${PERMISSION_LABELS[key]}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
