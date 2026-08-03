"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Rocket, Sparkles } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { ProductImage } from "@/components/ProductImage";
import { BRAND, ORG_SLUG, autoListQueue, getProduct } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { exportEbayListingPack, exportListingPacket } from "@/lib/demo-actions";
import { formatCurrency } from "@/lib/utils";

export default function AutoListPage() {
  const [rows, setRows] = useState(autoListQueue);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function listSelected() {
    const chosen = rows.filter((r) => selected.includes(r.id));
    if (!chosen.length) return;
    chosen.forEach((r) => {
      if (r.channel === "eBay") {
        exportEbayListingPack({
          title: r.title,
          sku: r.sku,
          channel: r.channel,
          price: r.price,
          productId: r.productId,
        });
      } else {
        exportListingPacket({
          title: r.title,
          sku: r.sku,
          channel: r.channel,
          price: r.price,
          productId: r.productId,
        });
      }
    });
    setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
    setToast(
      `${BRAND.autoList} published ${chosen.length} item(s). Listing packets downloaded.`
    );
    setSelected([]);
  }

  function exportQueue() {
    downloadCsv(
      `${ORG_SLUG}-auto-list-queue-${stamp()}.csv`,
      rows.map((r) => ({
        sku: r.sku,
        title: r.title,
        channel: r.channel,
        price: r.price,
        readiness: r.readiness,
        generatedAt: r.generatedAt,
      }))
    );
    setToast("Auto-List queue CSV downloaded.");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={BRAND.autoList}
        description={`${BRAND.ai} pushes ready products to marketplaces with pricing and channel routing.`}
        actions={
          <>
            <InfinityBadge />
            <Button variant="outline" type="button" onClick={exportQueue}>
              <Download className="h-4 w-4" /> Export queue
            </Button>
            <Link href="/products/auto-draft">
              <Button variant="outline" type="button">
                Open {BRAND.autoDraft}
              </Button>
            </Link>
            <Button variant="accent" type="button" disabled={!selected.length} onClick={listSelected}>
              <Rocket className="h-4 w-4" /> Auto-List + download
            </Button>
          </>
        }
      />

      {toast && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {toast}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Ready to list", value: String(rows.length) },
          {
            label: "Avg readiness",
            value: rows.length
              ? `${Math.round(rows.reduce((a, b) => a + b.readiness, 0) / rows.length)}%`
              : "—",
          },
          { label: "Channels", value: "SGW · eBay" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selected.length === rows.length && rows.length > 0}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                />
              </th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Readiness</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const product = getProduct(r.productId);
              return (
              <tr key={r.id} className="border-b hover:bg-mist/40">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="px-3 py-3">
                  <ProductImage
                    src={product?.imageUrls[0]}
                    seed={r.productId}
                    alt={r.title}
                    className="h-10 w-10"
                  />
                </td>
                <td className="px-3 py-3 font-mono text-xs">{r.sku}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span className="font-medium">{r.title}</span>
                  </div>
                </td>
                <td className="px-3 py-3">{r.channel}</td>
                <td className="px-3 py-3">{formatCurrency(r.price)}</td>
                <td className="px-3 py-3 font-semibold text-brand-orange">{r.readiness}%</td>
              </tr>
            );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  Nothing queued — Auto-List is caught up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
