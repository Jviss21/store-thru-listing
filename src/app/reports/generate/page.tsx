"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import {
  exportAllDemoJson,
  exportAutoDraftQueueCsv,
  exportAutoListQueueCsv,
  exportEventsCsv,
  exportItemCreationCsv,
  exportListingsCsv,
  exportManifestsCsv,
  exportOperationalCsv,
  exportOrdersCsv,
  exportProductivityCsv,
  exportProductsCsv,
  exportRefundsCsv,
  exportShipmentsCsv,
  exportSuppliersCsv,
  exportTopSalesCsv,
} from "@/lib/demo-actions";
import { BRAND, ORG_NAME, ORG_SLUG } from "@/lib/mock-data";

const OPTIONS = [
  { id: "sgw", label: "ShopGoodwill listings", run: () => exportListingsCsv("ShopGoodwill") },
  { id: "ebay", label: "eBay listings", run: () => exportListingsCsv("eBay") },
  { id: "orders", label: "Orders", run: () => exportOrdersCsv() },
  { id: "paid", label: "Paid orders", run: () => exportOrdersCsv({ paymentStatus: "Paid" }) },
  { id: "refunds", label: "Refunds", run: () => exportRefundsCsv() },
  { id: "intake", label: "Intake item batches", run: () => exportManifestsCsv() },
  { id: "itemcreation", label: "Item creation (supplier rollups)", run: () => exportItemCreationCsv() },
  { id: "shipments", label: "Shipments", run: () => exportShipmentsCsv() },
  { id: "products", label: "Products", run: () => exportProductsCsv() },
  {
    id: "autodraft",
    label: `${BRAND.autoDraft} queue`,
    run: () => exportAutoDraftQueueCsv(),
  },
  {
    id: "autolist",
    label: `${BRAND.autoList} queue`,
    run: () => exportAutoListQueueCsv(),
  },
  { id: "productivity", label: "Lister productivity", run: () => exportProductivityCsv() },
  { id: "operational", label: "Operational activity", run: () => exportOperationalCsv() },
  { id: "events", label: "Event logs", run: () => exportEventsCsv() },
  { id: "topsales", label: "Top sales", run: () => exportTopSalesCsv() },
  { id: "suppliers", label: "Suppliers", run: () => exportSuppliersCsv() },
  { id: "alljson", label: "Full demo JSON pack", run: () => exportAllDemoJson() },
];

export default function GenerateReportsPage() {
  const [selected, setSelected] = useState<string[]>(["sgw", "ebay", "autodraft", "autolist"]);
  const [done, setDone] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function generate() {
    const chosen = OPTIONS.filter((o) => selected.includes(o.id));
    chosen.forEach((o) => o.run());
    setDone(
      `Downloaded ${chosen.length} file${chosen.length === 1 ? "" : "s"} for ${ORG_NAME}. Check your Downloads folder.`
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Generate Reports
      </div>
      <PageHeader
        title="Generate Reports"
        description={`Download CSV/JSON packs for ${ORG_NAME}. Filenames use ${ORG_SLUG}-*.`}
      />
      <Card className="max-w-xl space-y-4 p-5">
        <p className="text-sm font-medium">Include</p>
        <ul className="space-y-2">
          {OPTIONS.map((opt) => (
            <li key={opt.id}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                />
                {opt.label}
              </label>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="accent" disabled={!selected.length} onClick={generate}>
            Download selected
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => setSelected(OPTIONS.map((o) => o.id))}
          >
            Select all
          </Button>
          <Button variant="outline" type="button" onClick={() => exportAllDemoJson()}>
            Download everything (JSON)
          </Button>
        </div>
        {done && <p className="text-sm font-medium text-brand-orange">{done}</p>}
      </Card>
    </div>
  );
}
