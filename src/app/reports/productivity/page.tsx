"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { BRAND, ORG_SLUG, listerProductivity } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";

export default function ProductivityReportPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Lister Productivity
      </div>
      <PageHeader
        title="Lister Productivity"
        description={`Manual posts plus ${BRAND.ai} ${BRAND.autoDraft} / ${BRAND.autoList} assists.`}
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-productivity-${stamp()}.csv`,
                listerProductivity as unknown as Record<string, unknown>[]
              );
              setFlash("Productivity CSV downloaded.");
              setTimeout(() => setFlash(null), 2000);
            }}
          >
            Download CSV
          </Button>
        }
      />
      {flash && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal">
          {flash}
        </div>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-3 py-2">Posted</th>
              <th className="px-3 py-2">Listed</th>
              <th className="px-3 py-2">Auto-Draft</th>
              <th className="px-3 py-2">Auto-List</th>
              <th className="px-3 py-2">Sold</th>
              <th className="px-3 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {listerProductivity.map((r) => (
              <tr key={r.user} className="border-b">
                <td className="px-4 py-3 font-medium">{r.user}</td>
                <td className="px-3 py-3">{r.posted}</td>
                <td className="px-3 py-3">{r.listed}</td>
                <td className="px-3 py-3">{r.autoDrafted}</td>
                <td className="px-3 py-3">{r.autoListed}</td>
                <td className="px-3 py-3">{r.sold}</td>
                <td className="px-3 py-3">{formatCurrency(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
