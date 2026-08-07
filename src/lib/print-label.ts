/**
 * Demo label builders for Dymo (PDF/HTML) and Zebra (ZPL).
 * Used by Admin preview and floor print-on-create.
 */

import type { PrintLabelFields, PrintPreviewMode, PrintSettings } from "@/lib/admin-ims";
import { barcodeStubBars } from "@/lib/sku";

export type LabelDemoData = {
  sku: string;
  title?: string;
  supplier?: string;
  location?: string;
  date?: string;
};

export const DEMO_LABEL: LabelDemoData = {
  sku: "2019561246",
  title: "Predominately Black Patagonia",
  supplier: "Q-Truck",
  location: "10-A",
  date: formatLabelDate(new Date()),
};

export function formatLabelDate(d: Date = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

export function resolveLabelLines(
  fields: PrintLabelFields,
  data: LabelDemoData
): { location?: string; supplier?: string; date?: string; title?: string; sku: string } {
  return {
    sku: data.sku,
    location: fields.inventoryLocation ? data.location || "—" : undefined,
    supplier: fields.supplier ? data.supplier || "—" : undefined,
    date: fields.date ? data.date || formatLabelDate() : undefined,
    title: fields.title ? data.title || "—" : undefined,
  };
}

/** Sample ZPL for Zebra preview / download. */
export function buildDemoZpl(fields: PrintLabelFields, data: LabelDemoData = DEMO_LABEL): string {
  const lines = resolveLabelLines(fields, data);
  const parts: string[] = [
    "^XA",
    "^CF0,28",
    "^FO40,30^FDHammoq^FS",
  ];
  let y = 70;
  if (lines.location) {
    parts.push(`^FO40,${y}^FDLOCATION: ${lines.location}^FS`);
    y += 32;
  }
  if (lines.supplier) {
    parts.push(`^FO40,${y}^FDSUPPLIER: ${lines.supplier}^FS`);
    y += 32;
  }
  if (lines.date) {
    parts.push(`^FO320,70^FD${lines.date}^FS`);
  }
  if (lines.title) {
    parts.push(`^FO40,${y + 10}^FD${lines.title.slice(0, 28)}^FS`);
    y += 42;
  }
  parts.push(`^FO60,${y + 10}^BY2^BCN,80,Y,N,N^FD${lines.sku}^FS`);
  parts.push("^XZ");
  return parts.join("\n");
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML document for Dymo / PDF-style print. */
export function buildPdfLabelHtml(
  fields: PrintLabelFields,
  data: LabelDemoData,
  opts?: { autoPrint?: boolean }
): string {
  const lines = resolveLabelLines(fields, data);
  const bars = barcodeStubBars(data.sku);
  const metaTop: string[] = [];
  if (lines.location) metaTop.push(`LOCATION: ${escapeHtml(lines.location)}`);
  if (lines.supplier) metaTop.push(`SUPPLIER: ${escapeHtml(lines.supplier)}`);
  const dateHtml = lines.date
    ? `<span class="date">${escapeHtml(lines.date)}</span>`
    : "";
  const titleHtml = lines.title
    ? `<p class="title">${escapeHtml(lines.title)}</p>`
    : "";
  const onload = opts?.autoPrint ? ' onload="print()"' : "";

  return `<!doctype html><html><head><title>Label ${escapeHtml(data.sku)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,Segoe UI,sans-serif;padding:24px;color:#0d1b34;background:#f4f6f9;margin:0}
  .card{background:#fff;border:2px solid #0d1b34;border-radius:10px;padding:16px 18px;max-width:340px;margin:0 auto;box-shadow:0 8px 24px rgba(13,27,52,.12)}
  .gold{background:#f0b429;height:6px;border-radius:3px;margin-bottom:12px}
  .row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
  .meta{font-size:10px;font-weight:700;letter-spacing:.04em;line-height:1.45;text-transform:uppercase;color:#0d1b34}
  .date{font-size:11px;font-weight:600;white-space:nowrap}
  .title{font-size:13px;font-weight:600;margin:12px 0 8px;text-align:center}
  .bars{text-align:center;font-size:16px;letter-spacing:1px;line-height:1;margin:8px 0 6px;font-family:ui-monospace,Menlo,Consolas,monospace}
  .sku{text-align:center;font-size:16px;font-weight:800;letter-spacing:.06em;font-family:ui-monospace,Menlo,Consolas,monospace}
  .hint{text-align:center;font-size:9px;color:#8a93a3;margin-top:10px}
  .brand{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#0d1b34;margin-bottom:8px}
</style></head><body${onload}>
<div class="card">
  <div class="gold"></div>
  <div class="brand">Hammoq · Unit label</div>
  <div class="row">
    <div class="meta">${metaTop.join("<br/>") || "&nbsp;"}</div>
    ${dateHtml}
  </div>
  ${titleHtml}
  <div class="bars">${escapeHtml(bars)}</div>
  <div class="sku">${escapeHtml(lines.sku)}</div>
  <p class="hint">Demo label — Dymo / PDF style</p>
</div>
</body></html>`;
}

export function printLabelFromSettings(
  print: PrintSettings,
  data: LabelDemoData,
  mode?: PrintPreviewMode
) {
  const effective = mode ?? (print.activeProfile === "zebra" ? "ZPL" : "PDF");
  if (effective === "ZPL") {
    const zpl = buildDemoZpl(print.labelFields, data);
    const blob = new Blob([zpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `label-${data.sku}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const html = buildPdfLabelHtml(print.labelFields, data, { autoPrint: true });
  const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=560");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
