"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { barcodeStubBars } from "@/lib/sku";
import { cn } from "@/lib/utils";

export function printUnitBarcode(opts: {
  sku: string;
  title?: string;
  supplier?: string;
  batch?: string;
}) {
  const { sku, title = "", supplier = "", batch = "" } = opts;
  const bars = barcodeStubBars(sku);
  const w = window.open("", "_blank", "noopener,noreferrer,width=420,height=560");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Barcode ${sku}</title>
<style>
  body{font-family:ui-monospace,Menlo,Consolas,monospace;padding:28px;color:#0d1b34;background:#fff}
  .card{border:2px solid #0d1b34;border-radius:12px;padding:20px;max-width:320px;margin:0 auto}
  .gold{background:#f0b429;height:8px;border-radius:4px;margin-bottom:14px}
  h1{font-size:11px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px}
  .title{font-size:13px;font-weight:600;margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .meta{font-size:11px;color:#5b6475;margin:0 0 14px;line-height:1.4}
  .bars{text-align:center;font-size:18px;letter-spacing:1px;line-height:1;margin:12px 0 8px}
  .sku{text-align:center;font-size:18px;font-weight:700;letter-spacing:.08em}
  .hint{text-align:center;font-size:10px;color:#8a93a3;margin-top:10px}
</style></head><body onload="print()">
<div class="card">
  <div class="gold"></div>
  <h1>Hammoq · Unit barcode</h1>
  ${title ? `<p class="title">${escapeHtml(title)}</p>` : ""}
  <p class="meta">${supplier ? `Supplier: ${escapeHtml(supplier)}<br/>` : ""}${
    batch ? `Batch: ${escapeHtml(batch)}<br/>` : ""
  }SKU / barcode</p>
  <div class="bars">${escapeHtml(bars)}</div>
  <div class="sku">${escapeHtml(sku)}</div>
  <p class="hint">Demo label — not sent to a live printer</p>
</div>
</body></html>`);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function BarcodeStub({
  sku,
  title,
  supplier,
  batch,
  className,
  compact,
}: {
  sku: string;
  title?: string;
  supplier?: string;
  batch?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-ink/10 bg-mist/40 px-3 py-2",
        compact ? "inline-flex flex-col gap-1" : "space-y-2",
        className
      )}
    >
      <p
        className={cn(
          "font-mono tracking-wider text-ink",
          compact ? "text-[10px] leading-none" : "text-xs text-center"
        )}
        aria-hidden
      >
        {barcodeStubBars(sku)}
      </p>
      <p className={cn("font-mono font-bold text-ink", compact ? "text-sm" : "text-center text-base")}>
        {sku}
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={compact ? "h-7 px-2 text-xs" : "w-full"}
        onClick={() => printUnitBarcode({ sku, title, supplier, batch })}
      >
        <Printer className="h-3.5 w-3.5" /> Print barcode
      </Button>
    </div>
  );
}
