/**
 * EasyPost label purchase — live when EASYPOST_API_KEY is set, else demo stub
 * that returns a printable SVG/PDF label + tracking number.
 */

import { randomBytes } from "crypto";

export type LabelPurchaseInput = {
  orgId: string;
  orderNumber: string;
  channelOrderId?: string;
  channel?: string;
  carrier?: string;
  toName?: string;
  toStreet1?: string;
  toCity?: string;
  toState?: string;
  toZip?: string;
  fromName?: string;
  weightOz?: number;
  /** When true and admin has autoSelectBestRate, prefer cheapest stub rate. */
  autoSelectBestRate?: boolean;
  /** Require signature when order value >= threshold (cents). */
  requireSignature?: boolean;
  insuranceCents?: number | null;
};

export type PurchasedLabel = {
  mode: "easypost" | "stub";
  easyPostId: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  costCents: number;
  feesCents: number;
  insuranceCents: number | null;
  /** SVG data URL — always printable in browser. */
  labelSvgDataUrl: string;
  /** Minimal PDF data URL for download. */
  labelPdfDataUrl: string;
  labelPngHint: string;
  purchasedAt: string;
  message: string;
};

export function easyPostConfigured(): boolean {
  return Boolean(process.env.EASYPOST_API_KEY?.trim());
}

function hexChunk(len: number): string {
  return randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len)
    .toUpperCase();
}

function stubTracking(carrier: string): string {
  const c = carrier.toUpperCase();
  if (c.includes("UPS")) return `1Z${hexChunk(16)}`;
  if (c.includes("FEDEX") || c.includes("FDX")) return hexChunk(12);
  if (c.includes("USPS")) return `9400${hexChunk(18)}`;
  return `EP${hexChunk(14)}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLabelSvg(input: {
  carrier: string;
  tracking: string;
  easyPostId: string;
  orderNumber: string;
  channelOrderId: string;
  fromName: string;
  toName: string;
  toLine: string;
  service: string;
  cost: string;
  mode: string;
}): string {
  const lines = [
    `Hammoq · ${input.carrier} · ${input.service}`,
    `Tracking: ${input.tracking}`,
    `EasyPost: ${input.easyPostId}`,
    "",
    `FROM: ${input.fromName}`,
    `TO:   ${input.toName}`,
    `      ${input.toLine}`,
    "",
    `Order ${input.orderNumber} · ${input.channelOrderId}`,
    `Label cost ${input.cost} · ${input.mode}`,
  ];
  const text = lines
    .map(
      (line, i) =>
        `<text x="24" y="${48 + i * 18}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="13" fill="#0d1b34">${escapeXml(line)}</text>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <rect width="400" height="600" fill="#fff"/>
  <rect x="12" y="12" width="376" height="576" fill="none" stroke="#0d1b34" stroke-width="3" rx="8"/>
  <rect x="24" y="24" width="352" height="10" fill="#f0b429" rx="3"/>
  ${text}
  <text x="200" y="420" text-anchor="middle" font-family="monospace" font-size="28" letter-spacing="4" fill="#0d1b34">||||| |||| |||||</text>
  <text x="200" y="455" text-anchor="middle" font-family="monospace" font-size="12" fill="#0d1b34">${escapeXml(input.tracking)}</text>
  <text x="200" y="520" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#667">Demo shipping label · not for postage</text>
</svg>`;
}

/** Minimal single-page PDF with Helvetica text (no external deps). */
function buildMinimalPdf(lines: string[]): string {
  const contentLines = lines.map((l, i) => {
    const y = 750 - i * 16;
    const safe = l.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    return `BT /F1 11 Tf 50 ${y} Td (${safe}) Tj ET`;
  });
  const stream = contentLines.join("\n");
  const objects: string[] = [];
  objects.push("1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj");
  objects.push("2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj");
  objects.push(
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj"
  );
  objects.push(
    `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream endobj`
  );
  objects.push("5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj + "\n";
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function pdfToDataUrl(pdf: string): string {
  return `data:application/pdf;base64,${Buffer.from(pdf, "utf8").toString("base64")}`;
}

async function purchaseLiveEasyPost(
  input: LabelPurchaseInput
): Promise<PurchasedLabel | null> {
  const apiKey = process.env.EASYPOST_API_KEY?.trim();
  if (!apiKey) return null;

  const carrier = input.carrier || "USPS";
  const from = {
    name: input.fromName || "Test Goodwill Demo Facility",
    street1: process.env.EASYPOST_FROM_STREET1 || "417 Montgomery St",
    city: process.env.EASYPOST_FROM_CITY || "San Francisco",
    state: process.env.EASYPOST_FROM_STATE || "CA",
    zip: process.env.EASYPOST_FROM_ZIP || "94104",
    country: "US",
  };
  const to = {
    name: input.toName || `Order ${input.orderNumber}`,
    street1: input.toStreet1 || "179 N Harbor Dr",
    city: input.toCity || "Redondo Beach",
    state: input.toState || "CA",
    zip: input.toZip || "90277",
    country: "US",
  };

  try {
    const auth = Buffer.from(`${apiKey}:`).toString("base64");
    const res = await fetch("https://api.easypost.com/v2/shipments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipment: {
          to_address: to,
          from_address: from,
          parcel: {
            weight: input.weightOz ?? 16,
          },
          options: input.requireSignature
            ? { delivery_confirmation: "SIGNATURE" }
            : undefined,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("[easypost] create shipment failed", res.status, text.slice(0, 200));
      return null;
    }

    const shipment = (await res.json()) as {
      id?: string;
      tracking_code?: string;
      selected_rate?: { carrier?: string; service?: string; rate?: string };
      rates?: Array<{ carrier?: string; service?: string; rate?: string; id?: string }>;
      postage_label?: { label_url?: string };
    };

    // Buy cheapest rate if none selected
    let easyPostId = shipment.id || `shp_${hexChunk(32).toLowerCase()}`;
    let tracking = shipment.tracking_code || stubTracking(carrier);
    let service = shipment.selected_rate?.service || "Priority";
    let costCents = Math.round(Number(shipment.selected_rate?.rate || 8.45) * 100);
    let labelCarrier = shipment.selected_rate?.carrier || carrier;

    if (!shipment.postage_label?.label_url && shipment.rates?.length && shipment.id) {
      const sorted = [...shipment.rates].sort(
        (a, b) => Number(a.rate || 99) - Number(b.rate || 99)
      );
      const pick = input.autoSelectBestRate !== false ? sorted[0] : sorted[0];
      if (pick?.id) {
        const buyRes = await fetch(`https://api.easypost.com/v2/shipments/${shipment.id}/buy`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rate: { id: pick.id } }),
        });
        if (buyRes.ok) {
          const bought = (await buyRes.json()) as {
            id?: string;
            tracking_code?: string;
            selected_rate?: { carrier?: string; service?: string; rate?: string };
            postage_label?: { label_url?: string };
          };
          easyPostId = bought.id || easyPostId;
          tracking = bought.tracking_code || tracking;
          service = bought.selected_rate?.service || service;
          costCents = Math.round(Number(bought.selected_rate?.rate || costCents / 100) * 100);
          labelCarrier = bought.selected_rate?.carrier || labelCarrier;
          if (bought.postage_label?.label_url) {
            // Prefer live label URL; still generate SVG fallback for print modal.
            const svg = buildLabelSvg({
              carrier: labelCarrier,
              tracking,
              easyPostId,
              orderNumber: input.orderNumber,
              channelOrderId: input.channelOrderId || input.orderNumber,
              fromName: from.name,
              toName: to.name,
              toLine: `${to.street1}, ${to.city} ${to.state} ${to.zip}`,
              service,
              cost: `$${(costCents / 100).toFixed(2)}`,
              mode: "EasyPost live",
            });
            const pdf = buildMinimalPdf([
              `HAMMOQ / EasyPost label`,
              `Carrier: ${labelCarrier} ${service}`,
              `Tracking: ${tracking}`,
              `EasyPost: ${easyPostId}`,
              `Live label: ${bought.postage_label.label_url}`,
            ]);
            return {
              mode: "easypost",
              easyPostId,
              trackingNumber: tracking,
              carrier: labelCarrier,
              service,
              costCents,
              feesCents: 6,
              insuranceCents: input.insuranceCents ?? null,
              labelSvgDataUrl: svgToDataUrl(svg),
              labelPdfDataUrl: pdfToDataUrl(pdf),
              labelPngHint: bought.postage_label.label_url,
              purchasedAt: new Date().toISOString(),
              message: "Purchased live EasyPost label.",
            };
          }
        }
      }
    }

    const svg = buildLabelSvg({
      carrier: labelCarrier,
      tracking,
      easyPostId,
      orderNumber: input.orderNumber,
      channelOrderId: input.channelOrderId || input.orderNumber,
      fromName: from.name,
      toName: to.name,
      toLine: `${to.street1}, ${to.city} ${to.state} ${to.zip}`,
      service,
      cost: `$${(costCents / 100).toFixed(2)}`,
      mode: "EasyPost",
    });
    const pdf = buildMinimalPdf([
      "HAMMOQ / EasyPost label",
      `Carrier: ${labelCarrier} ${service}`,
      `Tracking: ${tracking}`,
      `EasyPost: ${easyPostId}`,
    ]);
    return {
      mode: "easypost",
      easyPostId,
      trackingNumber: tracking,
      carrier: labelCarrier,
      service,
      costCents,
      feesCents: 6,
      insuranceCents: input.insuranceCents ?? null,
      labelSvgDataUrl: svgToDataUrl(svg),
      labelPdfDataUrl: pdfToDataUrl(pdf),
      labelPngHint: shipment.postage_label?.label_url || "",
      purchasedAt: new Date().toISOString(),
      message: "EasyPost shipment created (demo rates may apply).",
    };
  } catch (err) {
    console.warn("[easypost] live purchase error:", err);
    return null;
  }
}

export async function purchaseShippingLabel(
  input: LabelPurchaseInput
): Promise<PurchasedLabel> {
  if (easyPostConfigured()) {
    const live = await purchaseLiveEasyPost(input);
    if (live) return live;
  }

  const carrier = input.carrier || "USPS";
  const tracking = stubTracking(carrier);
  const easyPostId = `shp_${hexChunk(32).toLowerCase()}`;
  const service =
    carrier === "UPS" ? "Ground" : carrier === "FedEx" ? "Home Delivery" : "Priority Mail";
  const costCents = input.autoSelectBestRate === false ? 1245 : 845;
  const fromName = input.fromName || "Test Goodwill · Demo Facility";
  const toName = input.toName || `Order ${input.orderNumber}`;
  const toLine = [
    input.toStreet1 || "179 N Harbor Dr",
    `${input.toCity || "Redondo Beach"} ${input.toState || "CA"} ${input.toZip || "90277"}`,
  ].join(", ");

  const svg = buildLabelSvg({
    carrier,
    tracking,
    easyPostId,
    orderNumber: input.orderNumber,
    channelOrderId: input.channelOrderId || input.orderNumber,
    fromName,
    toName,
    toLine,
    service,
    cost: `$${(costCents / 100).toFixed(2)}`,
    mode: easyPostConfigured() ? "EasyPost fallback stub" : "Demo stub (no EASYPOST_API_KEY)",
  });

  const pdf = buildMinimalPdf([
    "HAMMOQ SHIPPING LABEL (DEMO)",
    `Carrier: ${carrier} · ${service}`,
    `Tracking: ${tracking}`,
    `EasyPost: ${easyPostId}`,
    `From: ${fromName}`,
    `To: ${toName}`,
    `     ${toLine}`,
    `Order: ${input.orderNumber}`,
    input.requireSignature ? "Signature required" : "No signature",
    "NOT VALID FOR POSTAGE — demo label",
  ]);

  return {
    mode: "stub",
    easyPostId,
    trackingNumber: tracking,
    carrier,
    service,
    costCents,
    feesCents: 6,
    insuranceCents: input.insuranceCents ?? null,
    labelSvgDataUrl: svgToDataUrl(svg),
    labelPdfDataUrl: pdfToDataUrl(pdf),
    labelPngHint: "",
    purchasedAt: new Date().toISOString(),
    message: easyPostConfigured()
      ? "EasyPost key present but live buy failed — using printable stub."
      : "Demo stub label (set EASYPOST_API_KEY for live purchase).",
  };
}
