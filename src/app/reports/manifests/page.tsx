"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { ORG_SLUG, manifestReportRows } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";

export default function ManifestReportsPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Item Creation Reports
      </div>
      <PageHeader
        title="Item Creation Reports"
        description="Supplier-level rollups for intake batches."
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-item-creation-${stamp()}.csv`,
                manifestReportRows as unknown as Record<string, unknown>[]
              );
              setFlash("Item creation CSV downloaded.");
              setTimeout(() => setFlash(null), 2000);
            }}
          >
            Download CSV
          </Button>
        }
      />
      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-3 py-2">Batches</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Processed %</th>
              <th className="px-3 py-2">Cost recovery %</th>
            </tr>
          </thead>
          <tbody>
            {manifestReportRows.map((r) => (
              <tr key={r.supplier} className="border-b">
                <td className="px-4 py-3 font-medium">{r.supplier}</td>
                <td className="px-3 py-3">{r.manifests}</td>
                <td className="px-3 py-3">{r.items}</td>
                <td className="px-3 py-3">{r.processed}%</td>
                <td className="px-3 py-3">{r.recovery}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
