"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { BRAND, ORG_SLUG } from "@/lib/mock-data";
import { getCombinedAdminAudit } from "@/lib/admin-data";
import { downloadCsv, stamp } from "@/lib/download";
import { relativeTime } from "@/lib/utils";

export default function AdminAuditPage() {
  const rows = useMemo(() => getCombinedAdminAudit(), []);
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Audit log</h2>
          <p className="mt-1 text-sm text-muted">
            Admin-focused events — org, users, marketplaces, {BRAND.autoList}, sync, and
            stations.
          </p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            downloadCsv(
              `${ORG_SLUG}-admin-audit-${stamp()}.csv`,
              rows as unknown as Record<string, unknown>[]
            );
            setFlash("Admin audit CSV downloaded.");
            setTimeout(() => setFlash(null), 2000);
          }}
        >
          Download CSV
        </Button>
      </div>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-mist/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">When</th>
              <th className="px-3 py-2.5 font-semibold">User</th>
              <th className="px-3 py-2.5 font-semibold">Area</th>
              <th className="px-3 py-2.5 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.at}-${i}`} className="border-b border-ink/5">
                <td className="px-4 py-3 text-muted">{relativeTime(r.at)}</td>
                <td className="px-3 py-3 font-medium">{r.user}</td>
                <td className="px-3 py-3">{r.area}</td>
                <td className="px-3 py-3">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
