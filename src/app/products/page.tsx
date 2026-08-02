"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { ProductStatusBadge } from "@/components/StatusBadge";
import { InfinityBadge } from "@/components/Brand";
import { BRAND, products as seed } from "@/lib/mock-data";
import type { ProductStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { exportBarcodesTxt, exportProductsCsv, getCreatedProducts } from "@/lib/demo-actions";

const TABS: Array<ProductStatus | "All"> = ["All", "Active", "Draft", "Recycled"];

function ProductsInner() {
  const searchParams = useSearchParams();
  const initial = (searchParams.get("status") as ProductStatus | null) ?? "All";
  const [tab, setTab] = useState<ProductStatus | "All">(
    TABS.includes(initial as ProductStatus) || initial === "All"
      ? (initial as ProductStatus | "All")
      : "All"
  );
  const [q, setQ] = useState("");
  const [created, setCreated] = useState<ReturnType<typeof getCreatedProducts>>([]);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setCreated(getCreatedProducts());
  }, []);

  const merged = useMemo(() => {
    const local = created.map((p) => ({
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
      imageColor: "#c8f135",
      listedOn: p.listedOn as ("ShopGoodwill" | "eBay")[],
    }));
    return [...local, ...seed];
  }, [created]);

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
        description={`${BRAND.ai} drafts and lists sit alongside your catalog — export downloads real CSV files.`}
        actions={
          <>
            <Link href="/products/auto-draft">
              <Button variant="accent" type="button">
                {BRAND.autoDraft}
              </Button>
            </Link>
            <Link href="/products/auto-list">
              <Button variant="outline" type="button">
                {BRAND.autoList}
              </Button>
            </Link>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                exportProductsCsv();
                notice("Products CSV downloaded.");
              }}
            >
              Export CSV
            </Button>
            <Link href="/products/express-list">
              <Button variant="outline" type="button">
                Quick List
              </Button>
            </Link>
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

      <Card className="flex flex-wrap items-center gap-3 border-teal/20 bg-teal/5 p-4">
        <InfinityBadge />
        <p className="text-sm text-ink/80">
          Review {BRAND.autoDraft} suggestions, then push ready SKUs with {BRAND.autoList}.
        </p>
        <Link href="/products/auto-draft" className="ml-auto text-sm font-semibold text-teal hover:underline">
          Open queue
        </Link>
      </Card>

      {flash && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal">
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
        <Button type="button">Search</Button>
        <Button variant="outline" type="button">
          More filters
        </Button>
        <Button variant="outline" type="button">
          Sort
        </Button>
      </div>

      <p className="text-sm text-muted">{filtered.length} results</p>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <input type="checkbox" />
                </td>
                <td className="px-3 py-3">
                  <div
                    className="h-10 w-10 rounded border"
                    style={{ background: p.imageColor }}
                    title={p.title}
                  />
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
                <td className="px-3 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-3 py-3">{p.location}</td>
                <td className="px-3 py-3">{p.supplier}</td>
                <td className="px-3 py-3">
                  {p.listedOn.length ? (
                    <div className="flex flex-wrap gap-1">
                      {p.listedOn.map((c) => (
                        <span key={c} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
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
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading products…</div>}>
      <ProductsInner />
    </Suspense>
  );
}
