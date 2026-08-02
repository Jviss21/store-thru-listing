"use client";

import { Suspense } from "react";

// Re-export channel page pattern for eBay
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { listings as seed } from "@/lib/mock-data";
import type { Listing, ListingStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { exportListingPacket, exportListingsCsv } from "@/lib/demo-actions";

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

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      if (bucket === "Open" && ["Expired", "Delisted", "Recycled"].includes(l.status) && status === "All")
        return false;
      if (bucket === "Closed" && !["Expired", "Delisted", "Recycled", "Sold"].includes(l.status))
        return false;
      if (status !== "All" && l.status !== status) return false;
      if (!q) return true;
      return `${l.title} ${l.sku} ${l.externalId}`.toLowerCase().includes(q.toLowerCase());
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage eBay Listings"
        description="Failed listings and attention queues surface here from the home dashboard."
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
              status === s ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">Image</th>
              <th className="px-3 py-2">External ID</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr
                key={l.id}
                className="cursor-pointer border-b hover:bg-blue-50/50"
                onClick={() => setSelected(l)}
              >
                <td className="px-4 py-3">
                  <div className="h-10 w-10 rounded border" style={{ background: l.imageColor }} />
                </td>
                <td className="px-3 py-3 font-mono text-xs text-primary">{l.externalId}</td>
                <td className="px-3 py-3 font-mono text-xs">{l.sku}</td>
                <td className="px-3 py-3">{l.title}</td>
                <td className="px-3 py-3">
                  <ListingStatusBadge status={l.status} />
                </td>
                <td className="px-3 py-3">{formatCurrency(l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l bg-white shadow-xl">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <h2 className="font-semibold">eBay listing</h2>
            <button onClick={() => setSelected(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <h3 className="font-semibold">{selected.title}</h3>
            <ListingStatusBadge status={selected.status} />
            <p className="text-sm text-muted">{formatCurrency(selected.price)}</p>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" type="button" onClick={() => act("Edit (demo)")}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="success" type="button" onClick={() => {
                act("Listed — packet downloaded", "Active");
                if (selected) {
                  exportListingPacket({
                    title: selected.title,
                    sku: selected.sku,
                    channel: selected.channel,
                    price: selected.price,
                    category: selected.strategy,
                  });
                }
              }}>
                <Plus className="h-3.5 w-3.5" /> List + download
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
