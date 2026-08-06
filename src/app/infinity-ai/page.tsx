"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Eye, ExternalLink, GitBranch, Pencil, Rocket, Sparkles } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { ProductImage } from "@/components/ProductImage";
import {
  BRAND,
  INFINITY_AI_APP_STORE_URL,
  ORG_SLUG,
  autoListQueue,
  getProduct,
  listings,
} from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import {
  exportEbayListingPack,
  exportListingPacket,
  getCreatedProducts,
  saveCreatedProduct,
} from "@/lib/demo-actions";
import { mockPublishChannels, advanceProductStage } from "@/lib/channel-sim";
import { formatCurrency } from "@/lib/utils";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";
import { withStageTag } from "@/lib/workflow";
import { useOrg } from "@/components/OrgProvider";
import { normalizeRole } from "@/lib/roles";

export default function InfinityAiPage() {
  return (
    <RoleGate path="/infinity-ai">
      <Suspense fallback={<div className="p-8 text-sm text-muted">Loading {BRAND.ai}…</div>}>
        <InfinityAiInner />
      </Suspense>
    </RoleGate>
  );
}

function InfinityAiInner() {
  const searchParams = useSearchParams();
  const focusSku = (searchParams.get("sku") ?? "").trim().toUpperCase();
  const { session, isOps } = useOrg();
  const role = normalizeRole(session.role);
  const canPublish =
    isOps || role === "Admin" || role === "Ops Lead" || role === "Lister";
  const [rows, setRows] = useState(autoListQueue);
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<string | null>(null);

  useEffect(() => {
    if (!focusSku) return;
    const match = autoListQueue.find((r) => r.sku.toUpperCase() === focusSku);
    if (match) setSelected([match.id]);
  }, [focusSku]);

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
    if (!canPublish) return;
    const chosen = rows.filter((r) => selected.includes(r.id));
    if (!chosen.length) return;

    const publishedSkus: string[] = [];
    for (const r of chosen) {
      let product = getCreatedProducts().find((p) => p.id === r.productId || p.sku === r.sku);
      const seed = getProduct(r.productId);
      if (!product && seed) {
        product = saveCreatedProduct({
          id: seed.id,
          title: seed.title,
          sku: seed.sku,
          category: seed.category,
          categoryPath: seed.categoryPath,
          supplier: seed.supplier,
          price: r.price,
          location: seed.location,
          description: seed.description ?? "",
          status: "Active",
          imageNames: [],
          imageUrls: seed.imageUrls,
          createdAt: seed.createdAt,
          listedOn: [],
          condition: seed.condition,
          brand: seed.brand,
          strategy: seed.strategy,
          tags: withStageTag(seed.tags, "qa"),
          upc: seed.upc,
        });
      }
      if (product) {
        mockPublishChannels(product.id, [r.channel as "ShopGoodwill" | "eBay"], {
          price: r.price,
        });
        advanceProductStage(product.id, product.strategy ? "listed" : "strategy");
        publishedSkus.push(product.sku);
      }
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
    }

    setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
    setToast(
      `${BRAND.autoList} published ${chosen.length} item(s) (mock channels + packets). Next: listing strategy.`
    );
    setHandoff(publishedSkus[0] ?? null);
    logEvent({
      section: "auto-list",
      action: `Published ${chosen.length} item(s)`,
      resource: "Infinity AI / Auto-List run",
      resourceHref: "/infinity-ai",
    });
    setSelected([]);
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-card sm:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
            <Rocket className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Primary · photograph in {BRAND.ai}
              </p>
              <InfinityBadge />
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Photo in {BRAND.ai} → appears here
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Use the {BRAND.ai} iOS app on the floor. Photos and AI listing fields land in this IMS
              queue — then {BRAND.autoList} pushes to channels. This is the main ecom photo path;
              Donor Item Creation stays separate for manual batches.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={INFINITY_AI_APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  logEvent({
                    section: "auto-list",
                    action: `Opened ${BRAND.ai} App Store`,
                    resource: BRAND.ai,
                    resourceHref: INFINITY_AI_APP_STORE_URL,
                  })
                }
              >
                <Button variant="accent" type="button">
                  <ExternalLink className="h-4 w-4" /> Get {BRAND.ai} on App Store
                </Button>
              </a>
              <Link href="/workflow">
                <Button
                  variant="outline"
                  type="button"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  <GitBranch className="h-4 w-4" /> Item pipeline · ecom photo stage
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PageHeader
        title={`${BRAND.ai} · ${BRAND.autoList} queue`}
        description={`Items that arrived from ${BRAND.ai} / ${BRAND.autoList}. Ready packets use each product’s Listing Strategy for weight, dims, shipping, and channel defaults.`}
        actions={
          <>
            <InfinityBadge />
            <Button
              variant="outline"
              type="button"
              onClick={() =>
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
                )
              }
            >
              <Download className="h-4 w-4" /> Export queue
            </Button>
            {canPublish && (
              <Button
                variant="primary"
                type="button"
                disabled={!selected.length}
                onClick={listSelected}
              >
                <Rocket className="h-4 w-4" /> Try Auto-List + download
              </Button>
            )}
          </>
        }
      />

      {toast && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm">{toast}</div>
      )}
      {handoff && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-ink">
            Next for <span className="font-mono font-semibold">{handoff}</span>: assign / advance listing
            strategy (auction → BIN → concurrent → purge).
          </p>
          <Link href={`/products?q=${encodeURIComponent(handoff)}`}>
            <Button type="button" variant="accent" size="sm">
              Open products
            </Button>
          </Link>
        </Card>
      )}
      {focusSku && (
        <p className="text-sm text-muted">
          Focusing queue on SKU <span className="font-mono font-semibold text-ink">{focusSku}</span>
        </p>
      )}

      <Card className="border-ink/10 bg-mist/40 p-4 text-sm text-muted">
        Floor path: photograph in <span className="font-medium text-ink">{BRAND.ai}</span> → queue
        below → {BRAND.autoList} applies Strategy (Admin → Listing defaults) when building eBay /
        ShopGoodwill packets.
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">
                {canPublish ? (
                  <input
                    type="checkbox"
                    checked={selected.length === rows.length && rows.length > 0}
                    onChange={(e) =>
                      setSelected(e.target.checked ? rows.map((r) => r.id) : [])
                    }
                  />
                ) : null}
              </th>
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
                <tr
                  key={r.id}
                  className={`border-b hover:bg-mist/40 ${
                    focusSku && r.sku.toUpperCase() === focusSku ? "bg-accent/10" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    {canPublish ? (
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggle(r.id)}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={editProduct}>
                      <ProductImage
                        src={product?.imageUrls[0]}
                        seed={r.productId}
                        alt={r.title}
                        className="h-10 w-10"
                      />
                    </Link>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    <Link href={editProduct} className="text-primary hover:underline">
                      {r.sku}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <Link href={editProduct} className="font-medium text-primary hover:underline">
                        {r.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-3 py-3">{r.channel}</td>
                  <td className="px-3 py-3">{formatCurrency(r.price)}</td>
                  <td className="px-3 py-3 font-semibold text-brand-orange">{r.readiness}%</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <Link href={editProduct}>
                        <Button size="sm" variant="outline" type="button">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Link href={listingHref(r.productId, r.channel)}>
                        <Button size="sm" variant="ghost" type="button">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
