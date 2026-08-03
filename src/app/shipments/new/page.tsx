"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { CARRIERS, CURRENT_USER, orders } from "@/lib/mock-data";
import { saveCreatedShipment } from "@/lib/shipments-store";
import type { ListingChannel } from "@/lib/types";

export default function NewShipmentPage() {
  const router = useRouter();
  const defaultOrder = orders.find((o) => o.fulfillmentStatus !== "Unfulfilled") ?? orders[0];
  const [orderNumber, setOrderNumber] = useState(defaultOrder?.orderNumber ?? "");
  const [channel, setChannel] = useState<ListingChannel>(defaultOrder?.channel ?? "eBay");
  const [carrier, setCarrier] = useState(CARRIERS[0] ?? "FedEx");
  const [tracking, setTracking] = useState("");
  const [insurance, setInsurance] = useState("");
  const [cost, setCost] = useState("8.45");
  const [flash, setFlash] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const row = saveCreatedShipment({
      orderNumber,
      channel,
      carrier,
      trackingNumber: tracking || undefined,
      createdBy: CURRENT_USER.handle,
      packedBy: CURRENT_USER.handle,
      insurance: insurance ? Number(insurance) : null,
      cost: Number(cost) || 8.45,
      fees: 0.06,
    });
    setFlash(`Shipment ${row.shipmentNumber} created.`);
    setTimeout(() => router.push("/shipments"), 600);
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/shipments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to shipments
      </Link>

      <PageHeader
        title="New shipment"
        description="Demo stub — creates a mock label and stores it in this browser."
      />

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="p-5">
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Order number
            </span>
            <Input
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-2001"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Channel
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
                value={channel}
                onChange={(e) => setChannel(e.target.value as ListingChannel)}
              >
                <option value="eBay">eBay</option>
                <option value="ShopGoodwill">ShopGoodwill</option>
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Carrier
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
              >
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Tracking number (optional)
            </span>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Leave blank to auto-generate"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Label cost
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Insurance (optional)
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                placeholder="—"
              />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Link href="/shipments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="accent">
              Create shipment
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
