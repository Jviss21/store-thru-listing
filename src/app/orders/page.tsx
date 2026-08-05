"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ChevronDown,
  ClipboardList,
  Download,
  Filter,
  Plus,
  Search,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import {
  MoreFiltersDrawer,
  uniqueOrderLocations,
} from "@/components/orders/MoreFiltersDrawer";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { exportOrdersCsv } from "@/lib/demo-actions";
import { createPickListFromOpenOrders, getLiveOrders } from "@/lib/pick-lists-store";
import { orders as seedOrders } from "@/lib/mock-data";
import {
  applyOrderFilters,
  countActiveFilters,
  EMPTY_ORDER_FILTERS,
  filterChipLabels,
  ORDER_SORT_OPTIONS,
  orderMatchesTab,
  removeFilterChip,
  sortOrders,
  type OrdersFilterState,
  type OrdersSortKey,
  type OrdersTabId,
} from "@/lib/orders-filters";
import type { ListingChannel, Order } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type TabDef = {
  id: OrdersTabId;
  label: string;
  badge?: "overdue" | "urgent" | "missing";
};

const TABS: TabDef[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "ready", label: "Ready to fulfill" },
  { id: "not_found", label: "Not found", badge: "missing" },
  { id: "overdue_urgent", label: "Overdue & Urgent", badge: "overdue" },
  { id: "being_pulled", label: "Orders being Pulled" },
  { id: "picked", label: "Orders Picked" },
  { id: "multi_ready", label: "Multi-Orders Ready to Print" },
];

function ChannelIcon({ channel }: { channel: ListingChannel }) {
  if (channel === "eBay") {
    return (
      <span
        title="eBay"
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#e53238] text-[9px] font-black text-white"
      >
        e
      </span>
    );
  }
  return (
    <span
      title="ShopGoodwill"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-ink text-accent"
    >
      <ShoppingBag className="h-3 w-3" />
    </span>
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function paymentTone(status: Order["paymentStatus"]) {
  if (status === "Paid") return "green" as const;
  if (status === "Refunded" || status === "Partially Refunded") return "red" as const;
  return "yellow" as const;
}

function paymentLabel(status: Order["paymentStatus"]) {
  return status === "Pending" ? "Unpaid" : status;
}

function fulfillmentTone(status: Order["fulfillmentStatus"]) {
  if (status === "Fulfilled") return "green" as const;
  if (status === "Partial") return "yellow" as const;
  return "orange" as const;
}

function tabFromParam(raw: string | null): OrdersTabId {
  const ids = TABS.map((t) => t.id);
  if (raw && ids.includes(raw as OrdersTabId)) return raw as OrdersTabId;
  if (raw === "Unfulfilled") return "open";
  return "all";
}

function OrdersInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { org, hydrated } = useOrg();
  const [tab, setTab] = useState<OrdersTabId>(() =>
    tabFromParam(searchParams.get("tab") ?? searchParams.get("fulfillment"))
  );
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [filters, setFilters] = useState<OrdersFilterState>(EMPTY_ORDER_FILTERS);
  const [draftFilters, setDraftFilters] = useState<OrdersFilterState>(EMPTY_ORDER_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<OrdersSortKey>("date-desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [starred, setStarred] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [liveOrders, setLiveOrders] = useState(seedOrders);

  useEffect(() => {
    if (!hydrated) return;
    setLiveOrders(getLiveOrders(org.id));
  }, [hydrated, org.id, flash]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(t)) setSortOpen(false);
      if (moreRef.current && !moreRef.current.contains(t)) setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const tabCounts = useMemo(() => {
    const counts = {} as Record<OrdersTabId, number>;
    for (const t of TABS) {
      counts[t.id] = liveOrders.filter((o) => orderMatchesTab(o, t.id)).length;
    }
    return counts;
  }, [liveOrders]);

  const overdueCount = useMemo(
    () => liveOrders.filter((o) => o.isOverdue).length,
    [liveOrders]
  );
  const urgentCount = useMemo(
    () => liveOrders.filter((o) => o.isUrgent && !o.isOverdue).length,
    [liveOrders]
  );

  const locationOptions = useMemo(() => uniqueOrderLocations(liveOrders), [liveOrders]);

  const filtered = useMemo(() => {
    const byTab = liveOrders.filter((o) => orderMatchesTab(o, tab));
    const narrowed = applyOrderFilters(byTab, filters, appliedQuery);
    return sortOrders(narrowed, sort);
  }, [tab, filters, appliedQuery, sort, liveOrders]);

  const chips = filterChipLabels(filters);
  const activeFilterCount = countActiveFilters(filters);

  function flashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2200);
  }

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setAppliedQuery(query);
  }

  function openFilters() {
    setDraftFilters(filters);
    setFiltersOpen(true);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Marketplace orders across channels — search, filter, and fulfill like Upright Lister."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                exportOrdersCsv();
                flashMsg("Orders CSV downloaded.");
              }}
            >
              <Download className="h-4 w-4" /> Export
            </Button>

            <div className="relative" ref={moreRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoreOpen((o) => !o)}
              >
                More actions <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </Button>
              {moreOpen && (
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                    onClick={() => {
                      setMoreOpen(false);
                      flashMsg("USPS scan form — demo stub.");
                    }}
                  >
                    Create USPS scan form
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                    onClick={() => {
                      setMoreOpen(false);
                      if (!hydrated) {
                        flashMsg("Org still loading…");
                        return;
                      }
                      try {
                        const list = createPickListFromOpenOrders({
                          orgId: org.id,
                        });
                        flashMsg(`Pick list ${list.id} created.`);
                        router.push(`/orders/pick-lists/${list.id}`);
                      } catch (err) {
                        flashMsg(
                          err instanceof Error
                            ? err.message
                            : "Could not create pick list."
                        );
                      }
                    }}
                  >
                    Create pick list
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                    onClick={() => {
                      setMoreOpen(false);
                      exportOrdersCsv({ paymentStatus: "Paid" });
                      flashMsg("Paid orders CSV downloaded.");
                    }}
                  >
                    Export paid orders
                  </button>
                </div>
              )}
            </div>

            <Link href="/shipments/new">
              <Button type="button" variant="accent">
                <Plus className="h-4 w-4" /> New shipment
              </Button>
            </Link>

            <Link href="/orders/pick-lists">
              <Button type="button" variant="outline">
                <ClipboardList className="h-4 w-4" /> View pick lists
              </Button>
            </Link>
          </>
        }
      />

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-1 border-b border-ink/10">
          {TABS.map((t) => {
            const active = tab === t.id;
            const count = tabCounts[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent"
                    : "text-muted hover:text-ink"
                )}
              >
                <span>{t.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    active ? "bg-accent/25 text-ink" : "bg-ink/5 text-muted",
                    t.badge === "overdue" && count > 0 && "bg-coral/15 text-coral",
                    t.badge === "missing" &&
                      count > 0 &&
                      "bg-brand-orange/15 text-brand-orange"
                  )}
                >
                  {count}
                </span>
                {t.id === "overdue_urgent" &&
                  (overdueCount > 0 || urgentCount > 0) && (
                    <span className="flex gap-1">
                      {overdueCount > 0 && (
                        <span className="rounded bg-coral/20 px-1 text-[10px] font-bold text-coral">
                          {overdueCount} overdue
                        </span>
                      )}
                      {urgentCount > 0 && (
                        <span className="rounded bg-accent/35 px-1 text-[10px] font-bold text-ink">
                          {urgentCount} urgent
                        </span>
                      )}
                    </span>
                  )}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="p-4">
        <form
          onSubmit={runSearch}
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by SKU, title, market ID, buyer, item ID, tracker, or unit ID"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button type="button" variant="outline" onClick={openFilters}>
              <Filter className="h-4 w-4" />
              More filters
              {activeFilterCount > 0 && (
                <Badge tone="yellow" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <div className="relative" ref={sortRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSortOpen((o) => !o)}
              >
                <ArrowUpDown className="h-4 w-4" /> Sort
              </Button>
              {sortOpen && (
                <div className="absolute right-0 z-20 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                  {ORDER_SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "block w-full px-3 py-2 text-left text-sm hover:bg-mist",
                        sort === opt.id && "bg-accent/15 font-semibold"
                      )}
                      onClick={() => {
                        setSort(opt.id);
                        setSortOpen(false);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStarred((s) => !s);
                flashMsg(
                  starred
                    ? "Cleared saved filter star (stub)."
                    : "Saved current filters as starred preset (stub)."
                );
              }}
              title="Edit / save filters"
            >
              <Star className={cn("h-4 w-4", starred && "fill-accent text-accent")} />
              Edit filters
            </Button>
          </div>
        </form>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilters((f) => removeFilterChip(f, chip.key))}
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-mist/70 px-2.5 py-1 text-xs font-semibold text-ink hover:border-ink/25"
              >
                {chip.label}
                <X className="h-3 w-3 opacity-60" />
              </button>
            ))}
            <button
              type="button"
              className="text-xs font-semibold text-brand-orange hover:underline"
              onClick={() => setFilters(EMPTY_ORDER_FILTERS)}
            >
              Clear all
            </button>
          </div>
        )}

        <p className="mt-3 text-sm text-muted">
          {filtered.length.toLocaleString()} result
          {filtered.length === 1 ? "" : "s"}
          {appliedQuery ? ` for “${appliedQuery}”` : ""}
        </p>
      </Card>

      <Card className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            title="No orders found"
            description="Adjust search, tabs, or More filters to see matching orders."
          />
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Ship by</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Channel Order ID</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2">Fulfillment</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-ink/6 hover:bg-accent/8">
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${encodeURIComponent(o.id)}`}
                      className="font-semibold text-ink underline-offset-2 hover:text-brand-orange hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    {(o.isOverdue || o.isUrgent || o.isNotFound) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {o.isOverdue && (
                          <Badge tone="red" className="text-[10px]">
                            Overdue
                          </Badge>
                        )}
                        {o.isUrgent && !o.isOverdue && (
                          <Badge tone="yellow" className="text-[10px]">
                            Urgent
                          </Badge>
                        )}
                        {o.isNotFound && (
                          <Badge tone="orange" className="text-[10px]">
                            Not found
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-ink">
                      {formatShortDate(o.createdAt)}
                    </div>
                    <div className="text-xs text-muted">
                      {o.paidAt ? `Paid ${formatShortDate(o.paidAt)}` : "Unpaid"}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "font-medium",
                        o.isOverdue && "text-coral",
                        o.isUrgent && !o.isOverdue && "text-brand-orange"
                      )}
                    >
                      {formatShortDate(o.shipBy)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2">
                      <ChannelIcon channel={o.channel} />
                      <span className="text-xs text-muted">{o.channel}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-ink">
                    {o.channelOrderId}
                  </td>
                  <td className="px-3 py-3">{o.customer}</td>
                  <td className="px-3 py-3">
                    <Badge tone={paymentTone(o.paymentStatus)}>
                      {paymentLabel(o.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={fulfillmentTone(o.fulfillmentStatus)}>
                      {o.fulfillmentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <MoreFiltersDrawer
        open={filtersOpen}
        draft={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setFiltersOpen(false)}
        onClear={() => {
          setFilters(EMPTY_ORDER_FILTERS);
          setDraftFilters(EMPTY_ORDER_FILTERS);
        }}
        onApply={() => {
          setFilters(draftFilters);
          setFiltersOpen(false);
        }}
        locationOptions={locationOptions}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading orders…</div>}>
      <OrdersInner />
    </Suspense>
  );
}
