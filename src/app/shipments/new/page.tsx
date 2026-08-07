"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { CARRIERS, CURRENT_USER, orders } from "@/lib/mock-data";
import {
  purchaseLabelForShipment,
  saveCreatedShipment,
} from "@/lib/shipments-store";
import type { ListingChannel } from "@/lib/types";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";
import { loadAdminIms } from "@/lib/admin-ims";
import { ShipmentLabelModal } from "@/components/ShipmentLabelModal";
import type { Shipment } from "@/lib/types";

export default function NewShipmentPage() {
  const router = useRouter();
  const { org } = useOrg();
  const defaultOrder = orders.find((o) => o.fulfillmentStatus !== "Unfulfilled") ?? orders[0];
  const [orderNumber, setOrderNumber] = useState(defaultOrder?.orderNumber ?? "");
  const [channel, setChannel] = useState<ListingChannel>(defaultOrder?.channel ?? "eBay");
  const [carrier, setCarrier] = useState(CARRIERS[0] ?? "FedEx");
  const [tracking, setTracking] = useState("");
  const [insurance, setInsurance] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [easyPostHint, setEasyPostHint] = useState("");
  const [createdLabel, setCreatedLabel] = useState<Shipment | null>(null);
  const [shippingSettings, setShippingSettings] = useState(() => loadAdminIms(org.id).shipping);

  useEffect(() => {
    setShippingSettings(loadAdminIms(org.id).shipping);
  }, [org.id]);

  useEffect(() => {
    void fetch("/api/shipping/labels")
      .then((r) => r.json())
      .then((j: { easyPostConfigured?: boolean; message?: string }) => {
        setEasyPostHint(
          j.easyPostConfigured
            ? "EasyPost API key detected — live purchase when connected in Admin."
            : "Demo stub labels (set EASYPOST_API_KEY for live). Printable PDF/SVG always available."
        );
      })
      .catch(() => setEasyPostHint("Label API ready (stub mode)."));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBuying(true);

    const matched = orders.find(
      (o) => o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase()
    );
    const orderTotal = matched?.total ?? 0;
    const requireSignature =
      shippingSettings.autoRequireSignature &&
      orderTotal >= shippingSettings.signatureThreshold;
    const insuranceVal = insurance
      ? Number(insurance)
      : orderTotal >= shippingSettings.insuranceThreshold
        ? Math.round(orderTotal * 0.02 * 100) / 100
        : null;

    if (shippingSettings.requirePacking) {
      // Soft check — demo does not block, but surfaces the admin toggle.
      setFlash("Admin requires packing before ship — demo continues with label purchase.");
    }

    const purchased = await purchaseLabelForShipment({
      orderNumber,
      channel,
      channelOrderId: matched?.channelOrderId,
      carrier,
      insurance: insuranceVal,
      autoSelectBestRate: shippingSettings.autoSelectBestRate,
      requireSignature,
      orgId: org.id,
    });

    if (!purchased.ok || !purchased.label) {
      setError(purchased.error || "Could not purchase label.");
      setBuying(false);
      return;
    }

    const label = purchased.label;
    const row = saveCreatedShipment({
      orderNumber,
      channel,
      carrier: label.carrier || carrier,
      trackingNumber: tracking.trim() || label.trackingNumber,
      createdBy: CURRENT_USER.handle,
      packedBy: shippingSettings.autoSelectPacker
        ? CURRENT_USER.handle
        : CURRENT_USER.handle,
      insurance: insuranceVal,
      cost: label.costCents / 100,
      fees: label.feesCents / 100,
      easyPostId: label.easyPostId,
      labelSvgUrl: label.labelSvgDataUrl,
      labelPdfUrl: label.labelPdfDataUrl,
      labelImageUrl: label.labelPngHint || undefined,
      labelMode: label.mode,
    });

    setFlash(label.message);
    setCreatedLabel(row);
    setBuying(false);
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
        title="Buy shipping label"
        description="Purchases via EasyPost when configured; otherwise generates a printable demo PDF/SVG + tracking."
      />

      {easyPostHint && (
        <p className="text-sm text-muted">
          {easyPostHint}{" "}
          {shippingSettings.easyPostConnected ? (
            <span className="font-medium text-ink">Admin: EasyPost connected.</span>
          ) : (
            <Link href="/admin/shipping" className="text-primary hover:underline">
              Connect in Admin → Shipping
            </Link>
          )}
        </p>
      )}

      {(flash || error) && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-accent/35 bg-accent/10 text-ink"
          }`}
        >
          {error ?? flash}
        </div>
      )}

      <Card className="p-5">
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
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
                disabled={shippingSettings.autoSelectBestRate}
              >
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {shippingSettings.autoSelectBestRate && (
                <span className="text-[11px] text-muted">
                  Admin auto-selects best rate — carrier may change after purchase.
                </span>
              )}
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Tracking override (optional)
            </span>
            <Input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="Leave blank to use purchased tracking"
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
              placeholder={
                shippingSettings.insuranceThreshold
                  ? `Auto above $${shippingSettings.insuranceThreshold}`
                  : "—"
              }
            />
          </label>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Link href="/shipments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="accent" disabled={buying}>
              {buying ? "Purchasing…" : "Purchase & print label"}
            </Button>
          </div>
        </form>
      </Card>

      {createdLabel && (
        <ShipmentLabelModal
          shipment={createdLabel}
          onClose={() => {
            setCreatedLabel(null);
            router.push("/shipments");
          }}
        />
      )}

      <SectionEventLog section="shipments" title="Event log" />
    </div>
  );
}
