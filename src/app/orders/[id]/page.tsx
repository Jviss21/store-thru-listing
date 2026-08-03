"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { getOrder, shipments } from "@/lib/mock-data";
import { getCreatedShipments } from "@/lib/shipments-store";
import type { Shipment } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params.id ?? ""));
  const order = getOrder(id);
  const [relatedShipments, setRelatedShipments] = useState<Shipment[]>([]);

  useEffect(() => {
    if (!order) {
      setRelatedShipments([]);
      return;
    }
    const local = getCreatedShipments();
    setRelatedShipments(
      [...local, ...shipments].filter(
        (s) => s.orderId === order.id || s.orderNumber === order.orderNumber
      )
    );
  }, [order]);

  if (!order) {
    return (
      <div className="space-y-5">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <PageHeader
          title={`Order ${id}`}
          description="This order id isn’t in the seed catalog — open Orders to browse, or return to Shipments."
          actions={
            <Link href="/shipments">
              <Button type="button" variant="outline">
                <Truck className="h-4 w-4" /> Shipments
              </Button>
            </Link>
          }
        />
        <Card className="p-6 text-sm text-muted">
          No matching seed order for <span className="font-mono text-ink">{id}</span>.
          Locally created shipments may reference a demo order number only.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`${order.channel} · ${order.customer}`}
        actions={
          <Link href="/shipments">
            <Button type="button" variant="outline">
              <Truck className="h-4 w-4" /> Related shipments
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Payment</p>
          <div className="mt-2">
            <Badge
              tone={
                order.paymentStatus === "Paid"
                  ? "green"
                  : order.paymentStatus === "Refunded"
                    ? "red"
                    : "yellow"
              }
            >
              {order.paymentStatus}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
            Fulfillment
          </p>
          <div className="mt-2">
            <Badge
              tone={
                order.fulfillmentStatus === "Fulfilled"
                  ? "green"
                  : order.fulfillmentStatus === "Partial"
                    ? "yellow"
                    : "orange"
              }
            >
              {order.fulfillmentStatus}
            </Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Items</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{order.itemCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Total</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {formatCurrency(order.total)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Order details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Order ID</dt>
            <dd className="font-medium text-ink">{order.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Channel</dt>
            <dd className="font-medium text-ink">{order.channel}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Customer</dt>
            <dd className="font-medium text-ink">{order.customer}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Created</dt>
            <dd className="font-medium text-ink">
              {new Date(order.createdAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </Card>

      <Card className="overflow-x-auto">
        <div className="border-b border-ink/8 px-5 py-3">
          <h2 className="font-display text-lg font-semibold text-ink">Shipments</h2>
          <p className="text-sm text-muted">
            {relatedShipments.length
              ? `${relatedShipments.length} linked shipment(s)`
              : "No shipments linked yet."}
          </p>
        </div>
        {relatedShipments.length > 0 && (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-2">Shipment</th>
                <th className="px-3 py-2">Carrier</th>
                <th className="px-3 py-2">Tracking</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-5 py-2 text-right">Label cost</th>
              </tr>
            </thead>
            <tbody>
              {relatedShipments.map((s) => (
                <tr key={s.id} className="border-b hover:bg-accent/8">
                  <td className="px-5 py-3 font-medium text-ink">{s.shipmentNumber}</td>
                  <td className="px-3 py-3">{s.carrier}</td>
                  <td className="px-3 py-3 font-mono text-xs">{s.trackingNumber}</td>
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
                  <td className="px-5 py-3 text-right font-semibold">
                    {formatCurrency(s.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
