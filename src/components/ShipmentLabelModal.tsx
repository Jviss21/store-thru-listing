"use client";

import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui";
import { downloadBlob, downloadText } from "@/lib/download";
import type { Shipment } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { logEvent } from "@/lib/event-log";
import { loadSession } from "@/lib/session";

function labelText(shipment: Shipment) {
  return [
    "HAMMOQ SHIPPING LABEL",
    "================================",
    `Shipment: ${shipment.shipmentNumber}`,
    `EasyPost: ${shipment.easyPostId}`,
    `Carrier:  ${shipment.carrier}`,
    `Tracking:${shipment.trackingNumber}`,
    `Mode:     ${shipment.labelMode ?? "stub"}`,
    "",
    `From: Test Goodwill · Demo Facility`,
    `To:   Order ${shipment.channelOrderId}`,
    `      Channel ${shipment.channel}`,
    "",
    `Label cost: ${formatCurrency(shipment.cost)}`,
    `Fees:       ${formatCurrency(shipment.fees)}`,
    `Insurance:  ${shipment.insurance != null ? formatCurrency(shipment.insurance) : "—"}`,
    `Status:     ${shipment.status}`,
    `Created by: ${shipment.createdBy}`,
    `Packed by:  ${shipment.packedBy}`,
    "",
    "||||||||||||||||||||||||||||||||",
    `*${shipment.trackingNumber}*`,
    "||||||||||||||||||||||||||||||||",
  ].join("\n");
}

export function ShipmentLabelModal({
  shipment,
  onClose,
}: {
  shipment: Shipment;
  onClose: () => void;
}) {
  const body = labelText(shipment);
  const previewSrc =
    shipment.labelSvgUrl ||
    shipment.labelImageUrl ||
    null;

  function downloadLabel() {
    if (shipment.labelPdfUrl?.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = shipment.labelPdfUrl;
      a.download = `label-${shipment.shipmentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    if (shipment.labelSvgUrl?.startsWith("data:image/svg")) {
      downloadText(
        `label-${shipment.shipmentNumber}.svg`,
        decodeURIComponent(shipment.labelSvgUrl.replace(/^data:image\/svg\+xml[^,]*,/, "")),
        "image/svg+xml;charset=utf-8"
      );
      return;
    }
    if (shipment.labelImageUrl) {
      const a = document.createElement("a");
      a.href = shipment.labelImageUrl;
      a.download = `label-${shipment.shipmentNumber}.png`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    downloadText(
      `label-${shipment.shipmentNumber}.txt`,
      body,
      "text/plain;charset=utf-8"
    );
  }

  function downloadSvg() {
    if (!shipment.labelSvgUrl) return;
    if (shipment.labelSvgUrl.startsWith("data:")) {
      const raw = decodeURIComponent(
        shipment.labelSvgUrl.replace(/^data:image\/svg\+xml[^,]*,/, "")
      );
      downloadBlob(
        `label-${shipment.shipmentNumber}.svg`,
        new Blob([raw], { type: "image/svg+xml;charset=utf-8" })
      );
    }
  }

  function printLabel() {
    const w = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
    if (!w) return;
    const img = previewSrc
      ? `<img src="${previewSrc.replace(/"/g, "&quot;")}" alt="Shipping label" style="max-width:360px;width:100%;height:auto;border:1px solid #0d1b34;border-radius:8px"/>`
      : `<pre style="white-space:pre-wrap;font-size:12px">${body.replace(/</g, "&lt;")}</pre>`;
    w.document.write(`<!doctype html><html><head><title>Label ${shipment.shipmentNumber}</title>
<style>
  body{font-family:ui-monospace,Menlo,Consolas,monospace;padding:24px;color:#0d1b34}
  .card{max-width:400px}
  .gold{background:#f0b429;height:8px;border-radius:4px;margin-bottom:16px}
  h1{font-size:14px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px}
</style></head><body onload="print()">
<div class="card"><div class="gold"></div>
<h1>Hammoq · ${shipment.carrier}</h1>
${img}
</div></body></html>`);
    w.document.close();
    const session = loadSession();
    logEvent({
      section: "shipments",
      action: "Printed shipping label",
      resource: `Shipment ${shipment.shipmentNumber}`,
      resourceHref: "/shipments",
      entityId: shipment.id || shipment.shipmentNumber,
      detail: `${shipment.carrier} · ${shipment.trackingNumber}`,
      user: session.handle || undefined,
      userName: session.name || undefined,
      orgId: session.activeOrgId,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="label-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink/8 bg-ink px-5 py-3">
          <div>
            <p id="label-modal-title" className="font-display text-lg font-bold text-white">
              Shipping label
            </p>
            <p className="text-xs text-white/70">
              {shipment.shipmentNumber}
              {shipment.labelMode ? ` · ${shipment.labelMode}` : ""}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-gradient-to-b from-mist/80 to-white p-5">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={`Label ${shipment.trackingNumber}`}
              className="mx-auto max-h-[420px] w-full max-w-sm rounded-xl border border-ink/15 bg-white object-contain shadow-sm"
            />
          ) : (
            <div className="rounded-xl border-2 border-ink/80 bg-white p-5 shadow-sm">
              <div className="mb-3 h-2 rounded-full bg-accent" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    Hammoq · {shipment.carrier}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    {shipment.trackingNumber}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">{shipment.easyPostId}</p>
                </div>
                <CarrierMark carrier={shipment.carrier} large />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted">Ship to</p>
                  <p className="font-semibold text-ink">Order {shipment.channelOrderId}</p>
                  <p className="text-muted">{shipment.channel}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted">Label cost</p>
                  <p className="font-semibold text-ink">{formatCurrency(shipment.cost)}</p>
                  <p className="text-xs text-muted">Fees {formatCurrency(shipment.fees)}</p>
                </div>
              </div>
              <div className="mt-5 border-t border-dashed border-ink/20 pt-4 text-center">
                <p className="select-none text-2xl tracking-[0.2em] text-ink" aria-hidden>
                  ||||| |||| ||||| ||||
                </p>
                <p className="mt-1 font-mono text-xs text-ink">{shipment.trackingNumber}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-ink/8 bg-paper px-5 py-3">
          {shipment.labelSvgUrl && (
            <Button type="button" variant="outline" onClick={downloadSvg}>
              <Download className="h-4 w-4" /> SVG
            </Button>
          )}
          <Button type="button" variant="outline" onClick={printLabel}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button type="button" variant="accent" onClick={downloadLabel}>
            <Download className="h-4 w-4" />{" "}
            {shipment.labelPdfUrl ? "PDF" : "Download"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CarrierMark({
  carrier,
  large,
}: {
  carrier: string;
  large?: boolean;
}) {
  const size = large ? "h-10 w-10 text-[10px]" : "h-6 w-6 text-[8px]";
  const tone =
    carrier === "FedEx"
      ? "bg-[#4d148c] text-white"
      : carrier === "UPS"
        ? "bg-[#351c15] text-[#ffb500]"
        : carrier === "USPS"
          ? "bg-[#333366] text-white"
          : "bg-ink text-accent";
  const short =
    carrier === "FedEx" ? "FX" : carrier === "UPS" ? "UPS" : carrier === "USPS" ? "US" : "OT";
  return (
    <span
      title={carrier}
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-md font-bold ${tone}`}
    >
      {short}
    </span>
  );
}
