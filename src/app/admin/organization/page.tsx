"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { LOCATIONS, ORG_PROFILE } from "@/lib/admin-data";
import { loadAdminState, saveAdminState, type AdminPersistedState } from "@/lib/admin-settings";

export default function AdminOrganizationPage() {
  const [state, setState] = useState<AdminPersistedState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setState(loadAdminState());
  }, []);

  function persist() {
    if (!state) return;
    const next = {
      ...state,
      orgName: state.orgName.trim() || ORG_PROFILE.name,
      orgSlug: state.orgSlug.trim() || ORG_PROFILE.slug,
    };
    saveAdminState(next);
    setState(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!state) {
    return <p className="text-sm text-muted">Loading organization…</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Organization</h2>
        <p className="mt-1 text-sm text-muted">
          Customer org profile for this inventory demo. Changes persist in localStorage.
        </p>
      </div>

      <Card className="max-w-2xl space-y-4 p-5">
        <div>
          <label className="text-sm font-medium">Organization name</label>
          <Input
            className="mt-1"
            value={state.orgName}
            onChange={(e) => setState({ ...state, orgName: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <Input
            className="mt-1 font-mono text-sm"
            value={state.orgSlug}
            onChange={(e) => setState({ ...state, orgSlug: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Timezone</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
            value={state.timezone}
            onChange={(e) => setState({ ...state, timezone: e.target.value })}
          >
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="America/Denver">America/Denver</option>
            <option value="America/Chicago">America/Chicago</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Legal / DBA note</label>
          <p className="mt-1 text-sm text-ink">{ORG_PROFILE.legalName}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Branding notes</label>
          <textarea
            className="mt-1 min-h-[88px] w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
            value={state.brandingNotes}
            onChange={(e) => setState({ ...state, brandingNotes: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={persist}>
            Save organization
          </Button>
          {saved && <p className="text-sm text-mustard">Saved on this device.</p>}
        </div>
      </Card>

      <div>
        <h3 className="font-display text-lg font-bold text-ink">Locations & warehouses</h3>
        <p className="mt-1 text-sm text-muted">Facility map used by inventory locations and stations.</p>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-3 py-2.5 font-semibold">Code</th>
              <th className="px-3 py-2.5 font-semibold">Type</th>
              <th className="px-3 py-2.5 font-semibold">Region</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {LOCATIONS.map((loc) => (
              <tr key={loc.id} className="border-b border-ink/5">
                <td className="px-4 py-3 font-medium text-ink">{loc.name}</td>
                <td className="px-3 py-3 font-mono text-xs">{loc.code}</td>
                <td className="px-3 py-3">{loc.type}</td>
                <td className="px-3 py-3 text-muted">
                  {loc.city}, {loc.state}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={loc.active ? "green" : "neutral"}>
                    {loc.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
