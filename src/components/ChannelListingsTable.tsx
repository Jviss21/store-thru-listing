"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { ListingStatusBadge } from "@/components/StatusBadge";
import { ProductImage } from "@/components/ProductImage";
import { SyncErrorBanner, QaRequiredCallout } from "@/components/SyncErrorBanner";
import { useOrg } from "@/components/OrgProvider";
import { listings as seed } from "@/lib/mock-data";
import type { SyncError } from "@/lib/api";
import { canEditListing, type Listing, type ListingStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { exportListingsCsv } from "@/lib/demo-actions";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";

const OPEN_STATUSES: ListingStatus[] = [
  "Queued", "Active", "Unpaid", "Sold", "Expired", "Delisted", "Recycled", "Additional QA Required",
];

function ChannelListings({ channel, fromPath }: { channel: "eBay" | "ShopGoodwill"; fromPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as ListingStatus | null;
  const openId = searchParams.get("open");
  const { org, api, hydrated } = useOrg();
  const [bucket, setBucket] = useState<"Open" | "All" | "Closed">("Open");
  const [status, setStatus] = useState<ListingStatus | "All">(initialStatus ?? "All");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(seed.filter((l) => l.channel === channel));
  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);

  function editHref(listing: Listing) {
    const qs = new URLSearchParams();
    qs.set("from", fromPath);
    if (status !== "All") qs.set("status", status);
    return `/listings/${encodeURIComponent(listing.id)}?${qs.toString()}`;
  }

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const [listRes, errRes] = await Promise.all([
        api.listings.list(org.id, channel),
        api.ops.recentErrors(org.id),
      ]);
      if (listRes.ok) {
        setRows(listRes.data);
        if (openId) {
          const match = listRes.data.find((l) => l.id === openId || l.id.endsWith(`-${openId}`));
          if (match) {
            router.replace(editHref(match));
            return;
          }
        }
      }
      if (errRes.ok) setSyncErrors(errRes.data);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, org.id, api, openId, channel]);

  const qaCount = useMemo(
    () => rows.filter((l) => l.status === "Additional QA Required").length,
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((l) => {
      if (bucket === "Open" && ["Expired", "Delisted", "Recycled"].includes(l.status) && status === "All") return false;
      if (bucket === "Closed" && !["Expired", "Delisted", "Recycled", "Sold"].includes(l.status)) return false;
      if (status !== "All" && l.status !== status) return false;
      if (!q) return true;
      return `${l.title} ${l.sku} ${l.externalId}`.toLowerCase().includes(q.toLowerCase());
    });
  }, [rows, bucket, status, q]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Manage ${channel} Listings`}
        description={`Live and queued ${channel} listings for this org — review QA holds, edit drafts, and export CSV.`}
        howTo={[
          "Switch ShopGoodwill / eBay above, then filter by status or search title / SKU.",
          "Open a row (or Edit) to fix title, photos, price, and channel fields.",
          "Clear Additional QA Required before items can sell.",
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                exportListingsCsv(channel);
                logEvent({
                  section: "listings",
                  action: `Exported ${channel} listings CSV`,
                  resource: `${channel} listings`,
                  resourceHref: fromPath,
                });
              }}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <div className="flex gap-2 text-sm">
              <Link href="/listings/shopgoodwill" className={channel === "ShopGoodwill" ? "font-medium text-primary" : "text-muted hover:text-foreground"}>ShopGoodwill</Link>
              <span className="text-muted">/</span>
              <Link href="/listings/ebay" className={channel === "eBay" ? "font-medium text-primary" : "text-muted hover:text-foreground"}>eBay</Link>
            </div>
          </div>
        }
      />
      <SyncErrorBanner errors={syncErrors} channel={channel} />
      <QaRequiredCallout count={qaCount} href={`${fromPath}?status=Additional%20QA%20Required`} />
      <div className="flex flex-wrap gap-1 border-b">
        {(["Open", "All", "Closed"] as const).map((b) => (
          <button key={b} onClick={() => setBucket(b)} className={`border-b-2 px-3 py-2 text-sm ${bucket === b ? "border-primary font-medium text-primary" : "border-transparent text-muted"}`}>{b}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {(["All", ...OPEN_STATUSES] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs ${status === s ? "bg-ink text-white" : "bg-mist text-ink/80"}`}>{s}</button>
        ))}
      </div>
      <Input className="max-w-md" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState title="No listings in this view" description="Change filters or clear search." />
        ) : (
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="cursor-pointer border-b hover:bg-blue-50/50" onClick={() => router.push(editHref(l))}>
                  <td className="px-3 py-2"><ProductImage src={l.imageUrls[0]} seed={l.productId} alt={l.title} className="h-10 w-10" fallbackColor={l.imageColor} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{l.sku}</td>
                  <td className="px-3 py-2 max-w-[280px] truncate font-medium text-primary hover:underline">{l.title}</td>
                  <td className="px-3 py-2"><ListingStatusBadge status={l.status} /></td>
                  <td className="px-3 py-2">{formatCurrency(l.price)}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={editHref(l)}>
                      <Button size="sm" variant="outline" type="button">
                        <Eye className="h-3.5 w-3.5" /> {canEditListing(l) ? "Edit" : "View"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <SectionEventLog section="listings" title="Event log" />
    </div>
  );
}

export function EbayListingsInner() {
  return (
    <RoleGate path="/listings/ebay">
      <ChannelListings channel="eBay" fromPath="/listings/ebay" />
    </RoleGate>
  );
}

export function SgwListingsInner() {
  return (
    <RoleGate path="/listings/shopgoodwill">
      <ChannelListings channel="ShopGoodwill" fromPath="/listings/shopgoodwill" />
    </RoleGate>
  );
}
