"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { ProductStatusBadge } from "@/components/StatusBadge";
import { InfinityBadge } from "@/components/Brand";
import { ProductImage } from "@/components/ProductImage";
import { BRAND, products as seed } from "@/lib/mock-data";
import type { ProductStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  exportBarcodesTxt,
  exportProductsCsv,
  getCreatedProducts,
  getPhotoOverlay,
} from "@/lib/demo-actions";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";

const TABS: Array<ProductStatus | "All"> = ["All", "Active", "Draft", "Recycled"];

function ProductsInner() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("status") as ProductStatus | null) ?? "All";
  const [tab, setTab] = useState<ProductStatus | "All">(
    TABS.includes(initial as ProductStatus) || initial === "All"
      ? (initial as ProductStatus | "All")
      : "All"
  );
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [created, setCreated] = useState<ReturnType<typeof getCreatedProducts>>([]);
  const [dbProducts, setDbProducts] = useState<
    {
      id: string;
      title: string;
      sku: string;
      status: string;
      location?: string | null;
      supplier?: string | null;
      createdAt?: string;
      category?: string | null;
      price: number;
      imageUrls?: string[];
      listedOn?: string[];
    }[]
  >([]);
  const [dbSource, setDbSource] = useState<"prisma" | "mock" | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setCreated(getCreatedProducts());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products?includeMock=0");
        const json = (await res.json()) as {
          ok?: boolean;
          source?: string;
          data?: typeof dbProducts;
        };
        if (cancelled || !json.ok) return;
        if (json.source === "prisma" && Array.isArray(json.data)) {
          setDbProducts(json.data);
          setDbSource("prisma");
        }
      } catch {
        /* keep local ∪ mock */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl != null) setQ(fromUrl);
  }, [searchParams]);

  const merged = useMemo(() => {
    const fromDb = dbProducts.map((p) => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      status: p.status as ProductStatus,
      location: p.location ?? "Receiving",
      supplier: p.supplier ?? "—",
      createdBy: "db",
      createdAt: p.createdAt ?? new Date().toISOString(),
      category: p.category ?? "General Merchandise",
      price: p.price,
      imageColor: "#f0b429",
      imageUrls: p.imageUrls?.length ? p.imageUrls : getPhotoOverlay(p.id),
      listedOn: (p.listedOn ?? []) as ("ShopGoodwill" | "eBay")[],
    }));
    const dbSkus = new Set(fromDb.map((p) => p.sku.toUpperCase()));
    const local = created
      .filter((p) => !dbSkus.has(p.sku.toUpperCase()))
      .map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.sku,
        status: p.status as ProductStatus,
        location: p.location,
        supplier: p.supplier,
        createdBy: "jdoe",
        createdAt: p.createdAt,
        category: p.category,
        price: p.price,
        imageColor: "#f0b429",
        imageUrls: p.imageUrls?.length ? p.imageUrls : getPhotoOverlay(p.id),
        listedOn: p.listedOn as ("ShopGoodwill" | "eBay")[],
      }));
    return [
      ...fromDb,
      ...local,
      ...seed
        .filter((p) => !dbSkus.has(p.sku.toUpperCase()))
        .map((p) => {
          const overlay = getPhotoOverlay(p.id);
          return overlay.length ? { ...p, imageUrls: overlay } : p;
        }),
    ];
  }, [created, dbProducts]);

  const filtered = useMemo(() => {
    return merged.filter((p) => {
      if (tab !== "All" && p.status !== tab) return false;
      if (!q) return true;
      const hay = `${p.title} ${p.sku} ${p.supplier} ${p.id}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [tab, q, merged]);

  const counts = {
    All: merged.length,
    Active: merged.filter((p) => p.status === "Active").length,
    Draft: merged.filter((p) => p.status === "Draft").length,
    Recycled: merged.filter((p) => p.status === "Recycled").length,
  };

  function notice(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description={`Your inventory catalog — search SKUs, open a product journey, scan for putaway, or export CSV / barcodes.${
          dbSource === "prisma" ? " Showing Postgres catalog ∪ seed." : ""
        }`}
        howTo={[
          "Filter by Active / Draft / Recycled, or search title and SKU.",
          "Open a row to edit photos, strategy, and channel status.",
          `Use Scan / putaway for shelf assign; publish ready items from ${BRAND.ai}.`,
        ]}
        actions={
          <>
            <Link href="/products/scan">
              <Button variant="outline" type="button">
                Scan / putaway
              </Button>
            </Link>
            <Link href="/products/auto-list">
              <Button variant="accent" type="button">
                {BRAND.autoList}
              </Button>
            </Link>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                exportProductsCsv();
                logEvent({
                  section: "products",
                  action: "Exported products CSV",
                  resource: "Products export",
                  resourceHref: "/products",
                });
                notice("Products CSV downloaded.");
              }}
            >
              Export CSV
            </Button>
            <Link href="/products/scan-book">
              <Button variant="outline" type="button">
                Scan book
              </Button>
            </Link>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                exportBarcodesTxt(filtered.map((p) => p.sku));
                notice("Barcode sheet (.txt) downloaded.");
              }}
            >
              Generate barcodes
            </Button>
            <Link href="/products/draft">
              <Button variant="outline" type="button">
                Add draft product
              </Button>
            </Link>
            <Link href="/products/new">
              <Button variant="outline" type="button">
                Add product
              </Button>
            </Link>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 border-accent/25 bg-accent/[0.06] p-4">
        <InfinityBadge />
        <p className="text-sm text-ink/80">
          Push ready SKUs to marketplaces with {BRAND.autoList}.
        </p>
        <Link href="/products/auto-list" className="ml-auto text-sm font-semibold text-brand-orange hover:underline">
          Open queue
        </Link>
      </Card>

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}
      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 text-sm ${
              tab === t
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t === "Draft" ? "Drafts" : t}{" "}
            <span className="text-xs text-muted">({counts[t]})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Search products by SKU, ID, title, or unit ID."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className="text-sm text-muted">{filtered.length} results</p>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No products match"
            description={
              q
                ? "Try a different search, or clear the filter to see the full catalog."
                : "No products in this status yet."
            }
          />
        </Card>
      ) : (
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">
                <input type="checkbox" />
              </th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Listings</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="px-3 py-3">
                  <Link href={`/products/${p.id}`}>
                    <ProductImage
                      src={"imageUrls" in p ? p.imageUrls?.[0] : undefined}
                      seed={p.id}
                      alt={p.title}
                      className="h-10 w-10"
                      fallbackColor={p.imageColor}
                    />
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/products/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    <span>by {p.createdBy}</span>
                    <ProductStatusBadge status={p.status} />
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">
                  <Link href={`/products/${p.id}`} className="hover:underline">{p.sku}</Link>
                </td>
                <td className="px-3 py-3">{p.location}</td>
                <td className="px-3 py-3">{p.supplier}</td>
                <td className="px-3 py-3">
                  {p.listedOn.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.listedOn.map((c) => (
                        <span key={c} className="rounded bg-mist px-1.5 py-0.5 text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <Link href={`/listings/shopgoodwill?list=${p.id}`}>
                      <Button size="sm" variant="success" type="button">
                        List
                      </Button>
                    </Link>
                  )}
                  <div className="mt-1 text-xs text-muted">{formatCurrency(p.price)}</div>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/products/${p.id}`}>
                    <Button size="sm" variant="outline" type="button">Edit</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}

      <SectionEventLog section="products" title="Event log" />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <RoleGate path="/products">
      <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
        <ProductsInner />
      </Suspense>
    </RoleGate>
  );
}
