"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { ORG_SLUG, top50Sales } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";

export default function TopSalesPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Top 50 Sales
      </div>
      <PageHeader
        title="Top 50 Sales"
        description="Highest sold items across ShopGoodwill and eBay."
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-top-sales-${stamp()}.csv`,
                top50Sales as unknown as Record<string, unknown>[]
              );
              setFlash("Top sales CSV downloaded.");
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Sold</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Margin</th>
              <th className="px-3 py-2">Auto-List</th>
              <th className="px-3 py-2">Sold at</th>
            </tr>
          </thead>
          <tbody>
            {top50Sales.map((r) => (
              <tr key={r.rank} className="border-b">
                <td className="px-4 py-3 font-medium">{r.rank}</td>
                <td className="px-3 py-3">{r.title}</td>
                <td className="px-3 py-3">
                  <Badge tone="blue">{r.channel}</Badge>
                </td>
                <td className="px-3 py-3">{formatCurrency(r.soldPrice)}</td>
                <td className="px-3 py-3">{formatCurrency(r.cost)}</td>
                <td className="px-3 py-3 text-mustard">
                  {formatCurrency(r.soldPrice - r.cost)}
                </td>
                <td className="px-3 py-3">{r.autoListed ? "Yes" : "—"}</td>
                <td className="px-3 py-3 text-muted">
                  {new Date(r.soldAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
