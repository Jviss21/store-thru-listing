"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Badge, Card, PageHeader, Button } from "@/components/ui";
import { shipments } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { exportShipmentsCsv } from "@/lib/demo-actions";

export default function ShipmentsPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipments"
        description="Labels, carriers, and tracking for fulfilled orders."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                exportShipmentsCsv();
                setFlash("Shipments CSV downloaded.");
                setTimeout(() => setFlash(null), 2000);
              }}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button type="button">Create shipment</Button>
          </>
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
              <th className="px-4 py-2">Order</th>
              <th className="px-3 py-2">Carrier</th>
              <th className="px-3 py-2">Tracking</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Shipped</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-primary">{s.orderNumber}</td>
                <td className="px-3 py-3">{s.carrier}</td>
                <td className="px-3 py-3 font-mono text-xs">{s.trackingNumber}</td>
                <td className="px-3 py-3">{formatCurrency(s.cost)}</td>
                <td className="px-3 py-3 text-muted">
                  {new Date(s.shippedAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      s.status === "Delivered"
                        ? "green"
                        : s.status === "In transit"
                          ? "blue"
                          : "neutral"
                    }
                  >
                    {s.status}
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
