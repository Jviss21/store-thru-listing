"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { orders } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { exportOrdersCsv } from "@/lib/demo-actions";

function OrdersInner() {
  const searchParams = useSearchParams();
  const fulfillment = searchParams.get("fulfillment");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (fulfillment && o.fulfillmentStatus !== fulfillment) return false;
      if (!q) return true;
      return `${o.orderNumber} ${o.customer} ${o.channel}`.toLowerCase().includes(q.toLowerCase());
    });
  }, [q, fulfillment]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Paid and unpaid marketplace orders waiting on fulfillment."
        actions={
          <Button type="button" variant="outline" onClick={() => exportOrdersCsv()}>
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link href="/orders">
          <Badge tone={!fulfillment ? "blue" : "neutral"}>All</Badge>
        </Link>
        <Link href="/orders?fulfillment=Unfulfilled">
          <Badge tone={fulfillment === "Unfulfilled" ? "orange" : "neutral"}>Unfulfilled</Badge>
        </Link>
        <Link href="/orders?fulfillment=Partial">
          <Badge tone={fulfillment === "Partial" ? "yellow" : "neutral"}>Partial</Badge>
        </Link>
        <Link href="/orders?fulfillment=Fulfilled">
          <Badge tone={fulfillment === "Fulfilled" ? "green" : "neutral"}>Fulfilled</Badge>
        </Link>
      </div>

      <Input
        className="max-w-md"
        placeholder="Search orders…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Fulfillment</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b hover:bg-blue-50/40">
                <td className="px-4 py-3 font-medium text-primary">{o.orderNumber}</td>
                <td className="px-3 py-3">{o.channel}</td>
                <td className="px-3 py-3">{o.customer}</td>
                <td className="px-3 py-3">{o.itemCount}</td>
                <td className="px-3 py-3">{formatCurrency(o.total)}</td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      o.paymentStatus === "Paid"
                        ? "green"
                        : o.paymentStatus === "Refunded"
                          ? "red"
                          : "yellow"
                    }
                  >
                    {o.paymentStatus}
                  </Badge>
                </td>
                <td className="px-3 py-3">
                  <Badge
                    tone={
                      o.fulfillmentStatus === "Fulfilled"
                        ? "green"
                        : o.fulfillmentStatus === "Partial"
                          ? "yellow"
                          : "orange"
                    }
                  >
                    {o.fulfillmentStatus}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-muted">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading orders…</div>}>
      <OrdersInner />
    </Suspense>
  );
}
