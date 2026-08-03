"use client";

import { useOrg } from "@/components/OrgProvider";
import { cn } from "@/lib/utils";

export function OrgSwitcher({ className }: { className?: string }) {
  const { hydrated, org, orgs, setActiveOrgId } = useOrg();

  return (
    <label className={cn("block", className)}>
      <span className="sr-only">Active organization</span>
      <select
        className="w-full rounded-lg border border-ink/10 bg-mist/60 px-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-ink/25 focus:ring-2 focus:ring-accent/40"
        value={org.id}
        disabled={!hydrated}
        onChange={(e) => setActiveOrgId(e.target.value)}
        aria-label="Switch organization"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
