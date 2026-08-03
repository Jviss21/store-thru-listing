"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ban,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  Recycle,
  Trash2,
  X,
} from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { ListingStatusBadge } from "@/components/StatusBadge";
import { ProductImage } from "@/components/ProductImage";
import { SyncErrorBanner, QaRequiredCallout } from "@/components/SyncErrorBanner";
import { useOrg } from "@/components/OrgProvider";
import { listings as seed } from "@/lib/mock-data";
import type { SyncError } from "@/lib/api";
import type { Listing, ListingStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  exportEbayListingPack,
  exportListingsCsv,
} from "@/lib/demo-actions";

const OPEN_STATUSES: ListingStatus[] = [
  "Queued",
  "Unpaid",
  "Sold",
  "Expired",
  "Delisted",
  "Recycled",
  "Additional QA Required",
];

function EbayInner() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as ListingStatus | null;
  const openId = searchParams.get("open");
  const { org, api, hydrated } = useOrg();

  const [bucket, setBucket] = useState<"Open" | "All" | "Closed">("Open");
  const [status, setStatus] = useState<ListingStatus | "All">(
    initialStatus ?? "All"
  );
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(seed.filter((l) => l.channel === "eBay"));
  const [selected, setSelected] = useState<Listing | null>(
    openId ? seed.find((l) => l.id === openId) ?? null : null
  );
  const [toast, setToast] = useState<string | null>(null);
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const [listRes, errRes] = await Promise.all([
        api.listings.list(org.id, "eBay"),
        api.ops.recentErrors(org.id),
      ]);
      if (listRes.ok) {
        setRows(listRes.data);
        if (openId) {
          setSelected(listRes.data.find((l) => l.id === openId) ?? null);
        }
      }
      if (errRes.ok) setSyncErrors(errRes.data);
    })();
  }, [hydrated, org.id, api, openId]);

  const qaCount = useMemo(
    () => rows.filter((l) => l.status === "Additional QA Required").length,
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      if (bucket === "Open" && ["Expired", "Delisted", "Recycled"].includes(l.status) && status === "All")
        return false;
      if (bucket === "Closed" && !["Expired", "Delisted", "Recycled", "Sold"].includes(l.status))
        return false;
      if (status !== "All" && l.status !== status) return false;
      if (!q) return true;
      return `${l.title} ${l.sku} ${l.externalId} ${l.uprightProductId} ${l.tags.join(" ")} ${l.brand}`
        .toLowerCase()
        .includes(q.toLowerCase());
    });
  }, [rows, bucket, status, q]);

  function act(message: string, next?: ListingStatus) {
    if (selected && next) {
      setRows((prev) => prev.map((l) => (l.id === selected.id ? { ...l, status: next } : l)));
      setSelected((s) => (s ? { ...s, status: next } : s));
    }
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }

  function downloadPack(listing: Listing) {
    exportEbayListingPack(listing);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage eBay Listings"
        description="Failed listings and attention queues surface here. Export a complete eBay listing input pack (CSV + JSON)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => exportListingsCsv("eBay")}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <div className="flex gap-2 text-sm">
              <Link href="/listings/shopgoodwill" className="text-muted hover:text-foreground">
                ShopGoodwill
              </Link>
              <span className="text-muted">/</span>
              <Link href="/listings/ebay" className="font-medium text-primary">
                eBay
              </Link>
            </div>
          </div>
        }
      />

      {toast && (
        <div className="rounded-md border border-mustard/30 bg-mustard/10 px-4 py-2 text-sm text-ink">
          {toast}
        </div>
      )}

      <SyncErrorBanner errors={syncErrors} channel="eBay" />
      <QaRequiredCallout
        count={qaCount}
        href="/listings/ebay?status=Additional%20QA%20Required"
      />

      <div className="flex flex-wrap gap-1 border-b">
        {(["Open", "All", "Closed"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`border-b-2 px-3 py-2 text-sm ${
              bucket === b ? "border-primary font-medium text-primary" : "border-transparent text-muted"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {(["All", ...OPEN_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs ${
              status === s ? "bg-ink text-white" : "bg-mist text-ink/80 hover:bg-mist/80"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Input className="max-w-md" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />

      <Card className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            title="No eBay listings in this view"
            description="Change status filters or clear search to see matching listings."
          />
        ) : (
          <table className="w-full min-w-[1300px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Product ID</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Strategy</th>
                <th className="px-3 py-2">eBay ID</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Condition</th>
                <th className="px-3 py-2">Brand</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="cursor-pointer border-b hover:bg-blue-50/50"
                  onClick={() => setSelected(l)}
                >
                  <td className="px-3 py-2">
                    <ProductImage
                      src={l.imageUrls[0]}
                      seed={l.productId}
                      alt={l.title}
                      className="h-10 w-10"
                      fallbackColor={l.imageColor}
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-primary">{l.uprightProductId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.sku}</td>
                  <td className="px-3 py-2">
                    {l.tags.slice(0, 2).map((t) => (
                      <span key={t} className="mr-1 rounded bg-mist px-1.5 py-0.5 text-xs">
                        {t}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2 max-w-[110px] truncate">{l.strategy}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.externalId}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate font-medium">{l.title}</td>
                  <td className="px-3 py-2 text-xs">{l.condition}</td>
                  <td className="px-3 py-2">{l.brand}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{l.location}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate" title={l.categoryPath}>
                    {l.categoryPath}
                  </td>
                  <td className="px-3 py-2">
                    <ListingStatusBadge status={l.status} />
                  </td>
                  <td className="px-3 py-2">{formatCurrency(l.price)}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {new Date(l.postedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg border-l bg-white shadow-xl">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="font-semibold">eBay listing</h2>
            <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-mist">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 8rem)" }}>
            <div className="grid grid-cols-3 gap-2">
              {selected.imageUrls.slice(0, 3).map((url) => (
                <ProductImage
                  key={url}
                  src={url}
                  seed={selected.productId}
                  alt={selected.title}
                  className="aspect-square w-full"
                />
              ))}
            </div>
            <h3 className="font-semibold leading-snug">{selected.title}</h3>
            {selected.subtitle && <p className="text-sm text-muted">{selected.subtitle}</p>}
            <ListingStatusBadge status={selected.status} />
            <p className="text-sm font-medium">{formatCurrency(selected.price)}</p>
            <p className="text-sm text-muted">{selected.description}</p>
            <dl className="space-y-2 rounded-md border p-3 text-sm">
              {[
                ["SKU", selected.sku],
                ["eBay ID", selected.externalId],
                ["Product ID", selected.uprightProductId],
                ["Condition", selected.condition],
                ["Category path", selected.categoryPath],
                ["Brand / MPN / UPC", `${selected.brand} · ${selected.mpn || "—"} · ${selected.upc || "—"}`],
                ["Item specifics", Object.entries(selected.itemSpecifics).map(([k, v]) => `${k}: ${v}`).join(" · ")],
                ["Qty", String(selected.quantity)],
                ["Weight / dims", `${selected.weightLbs} lb · ${selected.lengthIn}×${selected.widthIn}×${selected.heightIn} in`],
                ["Shipping", selected.shippingPolicy],
                ["Returns", selected.returnsPolicy],
                ["Payment", selected.paymentPolicy],
                ["Item location", selected.itemLocation],
                ["Inventory location", selected.location],
                ["Supplier / carrier", `${selected.supplier} · ${selected.carrier}`],
                ["Strategy / tags", `${selected.strategy} · ${selected.tags.join(", ")}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="text-right text-xs">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" type="button" onClick={() => act("Edit (demo)")}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="success"
                type="button"
                onClick={() => {
                  act("Listed — eBay pack downloaded", "Active");
                  downloadPack(selected);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> List + download pack
              </Button>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => {
                  downloadPack(selected);
                  act("eBay listing input pack downloaded (CSV + JSON)");
                }}
              >
                <Download className="h-3.5 w-3.5" /> Download pack
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => act("Ended", "Delisted")}>
                <Ban className="h-3.5 w-3.5" /> End
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => act("Relisted", "Queued")}>
                <RefreshCw className="h-3.5 w-3.5" /> Relist
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => act("Recycled", "Recycled")}>
                <Recycle className="h-3.5 w-3.5" /> Recycle
              </Button>
              <Button size="sm" variant="danger" type="button" onClick={() => act("Deleted")}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EbayListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading listings…</div>}>
      <EbayInner />
    </Suspense>
  );
}
