"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { barcodeStubBars } from "@/lib/sku";
import { cn } from "@/lib/utils";
import { loadAdminIms, type PrintSettings } from "@/lib/admin-ims";
import { formatLabelDate, printLabelFromSettings } from "@/lib/print-label";
import { DEFAULT_ORG_ID } from "@/lib/orgs";

export function printUnitBarcode(opts: {
  sku: string;
  title?: string;
  supplier?: string;
  batch?: string;
  location?: string;
  orgId?: string;
  print?: PrintSettings;
}) {
  const { sku, title = "", supplier = "", batch = "", location, orgId, print } = opts;
  const settings =
    print ??
    loadAdminIms(orgId || DEFAULT_ORG_ID).print;

  printLabelFromSettings(settings, {
    sku,
    title: title || undefined,
    supplier: supplier || (batch ? `Batch ${batch}` : undefined),
    location: location || undefined,
    date: formatLabelDate(),
  });
}

export function BarcodeStub({
  sku,
  title,
  supplier,
  batch,
  location,
  orgId,
  className,
  compact,
}: {
  sku: string;
  title?: string;
  supplier?: string;
  batch?: string;
  location?: string;
  orgId?: string;
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
        onClick={() => printUnitBarcode({ sku, title, supplier, batch, location, orgId })}
      >
        <Printer className="h-3.5 w-3.5" /> Print barcode
      </Button>
    </div>
  );
}
