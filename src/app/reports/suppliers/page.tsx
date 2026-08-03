"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { ORG_SLUG, supplierReportRows } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { formatCurrency } from "@/lib/utils";

export default function SuppliersReportPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Suppliers
      </div>
      <PageHeader
        title="Suppliers"
        description="Store/source performance for Test Goodwill."
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-suppliers-${stamp()}.csv`,
                supplierReportRows.map((row) => ({
                  name: row.name,
                  amount: row.amount,
                  itemsListed: row.itemsListed,
                  itemsSold: row.itemsSold,
                  avgDaysToSell: row.avgDaysToSell,
                }))
              );
              setFlash("Suppliers CSV downloaded.");
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
              <th className="px-3 py-2">Sales (7d)</th>
              <th className="px-3 py-2">Listed</th>
              <th className="px-3 py-2">Sold</th>
              <th className="px-3 py-2">Avg days to sell</th>
              <th className="px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {supplierReportRows.map((r) => (
              <tr key={r.name} className="border-b">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-3 py-3">{formatCurrency(r.amount)}</td>
                <td className="px-3 py-3">{r.itemsListed}</td>
                <td className="px-3 py-3">{r.itemsSold}</td>
                <td className="px-3 py-3">{r.avgDaysToSell}</td>
                <td className="px-3 py-3">
                  <Sparkline values={r.spark} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
