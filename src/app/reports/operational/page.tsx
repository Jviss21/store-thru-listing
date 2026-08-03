"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { ORG_SLUG, operationalActivity } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";

export default function OperationalReportPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Operational Activity
      </div>
      <PageHeader
        title="Operational Activity"
        description="30-day pipeline throughput including Infinity AI Auto-List."
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-operational-${stamp()}.csv`,
                operationalActivity as unknown as Record<string, unknown>[]
              );
              setFlash("Operational CSV downloaded.");
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
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-3 py-2">Intake</th>
              <th className="px-3 py-2">Photographed</th>
              <th className="px-3 py-2">Posted</th>
              <th className="px-3 py-2">Auto-List</th>
              <th className="px-3 py-2">Sold</th>
              <th className="px-3 py-2">Shipped</th>
              <th className="px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {operationalActivity.map((r) => (
              <tr key={r.date} className="border-b">
                <td className="px-4 py-3 font-medium">{r.date}</td>
                <td className="px-3 py-3">{r.intake}</td>
                <td className="px-3 py-3">{r.photographed}</td>
                <td className="px-3 py-3">{r.posted}</td>
                <td className="px-3 py-3">{r.autoListed}</td>
                <td className="px-3 py-3">{r.sold}</td>
                <td className="px-3 py-3">{r.shipped}</td>
                <td className="px-3 py-3">
                  <Sparkline
                    values={[r.intake, r.autoListed, r.sold, r.shipped]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
