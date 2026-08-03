"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Eye, Pencil, Rocket, Sparkles } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { ProductImage } from "@/components/ProductImage";
import { BRAND, ORG_SLUG, autoListQueue, getProduct, listings } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { exportEbayListingPack, exportListingPacket } from "@/lib/demo-actions";
import { formatCurrency } from "@/lib/utils";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";

export default function AutoListPage() {
  return (
    <RoleGate path="/products/auto-list">
      <AutoListInner />
    </RoleGate>
  );
}

function AutoListInner() {
  const [rows, setRows] = useState(autoListQueue);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function productHref(productId: string) {
    return `/products/${encodeURIComponent(productId)}`;
  }

  function listingHref(productId: string, channel: string) {
    const match = listings.find((l) => l.productId === productId && l.channel === channel);
    return match ? `/listings/${encodeURIComponent(match.id)}` : productHref(productId);
  }

  function listSelected() {
    const chosen = rows.filter((r) => selected.includes(r.id));
    if (!chosen.length) return;
    chosen.forEach((r) => {
      if (r.channel === "eBay") {
        exportEbayListingPack({ title: r.title, sku: r.sku, channel: r.channel, price: r.price, productId: r.productId });
      } else {
        exportListingPacket({ title: r.title, sku: r.sku, channel: r.channel, price: r.price, productId: r.productId });
      }
    });
    setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
    setToast(`${BRAND.autoList} published ${chosen.length} item(s). Listing packets downloaded.`);
    logEvent({
      section: "auto-list",
      action: `Published ${chosen.length} item(s)`,
      resource: "Auto-List run",
      resourceHref: "/products/auto-list",
    });
    setSelected([]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={BRAND.autoList}
        description={`${BRAND.ai} pushes ready products using each product’s Listing Strategy for weight, dims, shipping, pricing, and channel payload defaults.`}
        actions={
          <>
            <InfinityBadge />
            <Button variant="outline" type="button" onClick={() => downloadCsv(`${ORG_SLUG}-auto-list-queue-${stamp()}.csv`, rows.map((r) => ({ sku: r.sku, title: r.title, channel: r.channel, price: r.price, readiness: r.readiness, generatedAt: r.generatedAt })))}>
              <Download className="h-4 w-4" /> Export queue
            </Button>
            <Button variant="accent" type="button" disabled={!selected.length} onClick={listSelected}>
              <Rocket className="h-4 w-4" /> Auto-List + download
            </Button>
          </>
        }
      />
      {toast && <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm">{toast}</div>}
      <Card className="border-ink/10 bg-mist/40 p-4 text-sm text-muted">
        Auto-List applies the product’s <span className="font-medium text-ink">Strategy</span> (Admin → Listing defaults)
        when building eBay / ShopGoodwill packets — carrier, box, weight, duration, and start/BIN pricing.
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2"><input type="checkbox" checked={selected.length === rows.length && rows.length > 0} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Readiness</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const product = getProduct(r.productId);
              const editProduct = productHref(r.productId);
              return (
                <tr key={r.id} className="border-b hover:bg-mist/40">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="px-3 py-3"><Link href={editProduct}><ProductImage src={product?.imageUrls[0]} seed={r.productId} alt={r.title} className="h-10 w-10" /></Link></td>
                  <td className="px-3 py-3 font-mono text-xs"><Link href={editProduct} className="text-primary hover:underline">{r.sku}</Link></td>
                  <td className="px-3 py-3"><div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-accent" /><Link href={editProduct} className="font-medium text-primary hover:underline">{r.title}</Link></div></td>
                  <td className="px-3 py-3">{r.channel}</td>
                  <td className="px-3 py-3">{formatCurrency(r.price)}</td>
                  <td className="px-3 py-3 font-semibold text-brand-orange">{r.readiness}%</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <Link href={editProduct}><Button size="sm" variant="outline" type="button"><Pencil className="h-3.5 w-3.5" /> Edit</Button></Link>
                      <Link href={listingHref(r.productId, r.channel)}><Button size="sm" variant="ghost" type="button"><Eye className="h-3.5 w-3.5" /></Button></Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <SectionEventLog section="auto-list" />
    </div>
  );
}
