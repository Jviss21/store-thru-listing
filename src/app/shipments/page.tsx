"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Plus,
  Search,
  ShoppingBag,
} from "lucide-react";
import { CarrierMark, ShipmentLabelModal } from "@/components/ShipmentLabelModal";
import { Badge, Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { exportShipmentsCsv } from "@/lib/demo-actions";
import { getAllShipments } from "@/lib/shipments-store";
import type { ListingChannel, Shipment } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";

type SortKey = "date-desc" | "date-asc" | "cost-desc" | "cost-asc" | "carrier";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "date-desc", label: "Date · newest" },
  { id: "date-asc", label: "Date · oldest" },
  { id: "cost-desc", label: "Label cost · high" },
  { id: "cost-asc", label: "Label cost · low" },
  { id: "carrier", label: "Carrier A–Z" },
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

function formatShipDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function ShipmentsInner() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [carrierFilter, setCarrierFilter] = useState<string>("All");
  const [channelFilter, setChannelFilter] = useState<"All" | ListingChannel>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [labelShipment, setLabelShipment] = useState<Shipment | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRows(getAllShipments());
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(t)) setSortOpen(false);
      if (moreRef.current && !moreRef.current.contains(t)) setMoreOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(t)) setActionsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    let list = rows.filter((s) => {
      if (carrierFilter !== "All" && s.carrier !== carrierFilter) return false;
      if (channelFilter !== "All" && s.channel !== channelFilter) return false;
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        s.shipmentNumber,
        s.orderNumber,
        s.channelOrderId,
        s.trackingNumber,
        s.easyPostId,
        s.carrier,
        s.createdBy,
        s.packedBy,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === "date-desc")
        return new Date(b.shippedAt).getTime() - new Date(a.shippedAt).getTime();
      if (sort === "date-asc")
        return new Date(a.shippedAt).getTime() - new Date(b.shippedAt).getTime();
      if (sort === "cost-desc") return b.cost - a.cost;
      if (sort === "cost-asc") return a.cost - b.cost;
      return a.carrier.localeCompare(b.carrier);
    });
    return list;
  }, [rows, appliedQuery, carrierFilter, channelFilter, statusFilter, sort]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((s) => selected.includes(s.id));

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const ids = new Set(filtered.map((s) => s.id));
      setSelected((prev) => prev.filter((id) => !ids.has(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...filtered.map((s) => s.id)])));
    }
  }

  function selectAllResults() {
    setSelected(filtered.map((s) => s.id));
  }

  function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setAppliedQuery(query);
    setSelected([]);
  }

  function flashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2200);
  }

  const activeFilterCount =
    (carrierFilter !== "All" ? 1 : 0) +
    (channelFilter !== "All" ? 1 : 0) +
    (statusFilter !== "All" ? 1 : 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shipments"
        description="Labels, carriers, and EasyPost tracking for fulfilled orders."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                exportShipmentsCsv();
                logEvent({
                  section: "shipments",
                  action: "Exported shipments CSV",
                  resource: "Shipments export",
                  resourceHref: "/shipments",
                });
                flashMsg("Shipments CSV downloaded.");
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
                <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                    onClick={() => {
                      setMoreOpen(false);
                      flashMsg("Print pick list — demo stub.");
                    }}
                  >
                    Print pick list
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                    onClick={() => {
                      setMoreOpen(false);
                      flashMsg("Sync carriers — demo stub.");
                    }}
                  >
                    Sync carriers
                  </button>
                </div>
              )}
            </div>

            <Link href="/shipments/new">
              <Button type="button" variant="accent">
                <Plus className="h-4 w-4" /> New shipment
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
              placeholder="Search shipments by order ID, tracking number or EasyPost ID"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen((o) => !o)}
            >
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
                <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
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
          </div>
        </form>

        {filtersOpen && (
          <div className="mt-4 grid gap-3 rounded-xl border border-ink/8 bg-mist/40 p-3 sm:grid-cols-3">
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Carrier
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-normal normal-case text-ink"
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="USPS">USPS</option>
                <option value="OnTrac">OnTrac</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Channel
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-normal normal-case text-ink"
                value={channelFilter}
                onChange={(e) =>
                  setChannelFilter(e.target.value as "All" | ListingChannel)
                }
              >
                <option value="All">All</option>
                <option value="eBay">eBay</option>
                <option value="ShopGoodwill">ShopGoodwill</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Status
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-normal normal-case text-ink"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Label created">Label created</option>
                <option value="In transit">In transit</option>
                <option value="Delivered">Delivered</option>
              </select>
            </label>
            <div className="sm:col-span-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCarrierFilter("All");
                  setChannelFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}

        <p className="mt-3 text-sm text-muted">
          {filtered.length >= 1000
            ? "More than 1,000 results"
            : `${filtered.length.toLocaleString()} result${filtered.length === 1 ? "" : "s"}`}
        </p>
      </Card>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-ink px-4 py-3 text-sm text-white shadow-glow">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              className="h-4 w-4 rounded border-white/30"
            />
            <span className="font-semibold">{selected.length} selected</span>
          </label>

          <div className="relative" ref={actionsRef}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setActionsOpen((o) => !o)}
            >
              Actions <ChevronDown className="h-3.5 w-3.5" />
            </Button>
            {actionsOpen && (
              <div className="absolute left-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-ink/10 bg-white py-1 text-ink shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-mist"
                  onClick={() => {
                    setActionsOpen(false);
                    flashMsg(
                      `Request refunds queued for ${selected.length} shipment(s) — demo stub.`
                    );
                  }}
                >
                  <span className="font-semibold text-brand-orange">$</span> Request Refunds
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-mist"
                  onClick={() => {
                    setActionsOpen(false);
                    setSelected([]);
                    flashMsg("Selection cleared.");
                  }}
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="text-accent underline-offset-2 hover:underline"
            onClick={selectAllResults}
          >
            Select all {filtered.length.toLocaleString()}
          </button>

          <button
            type="button"
            className="ml-auto text-white/70 hover:text-white"
            aria-label="More"
            onClick={() => flashMsg("Bulk tools — demo stub.")}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      )}

      <Card className="overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            title="No shipments found"
            description="Try another search, clear filters, or create a new shipment."
          />
        ) : (
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b bg-ink text-xs uppercase tracking-wide text-white/80">
              <tr>
                <th className="px-4 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select all visible"
                    className="h-4 w-4 rounded"
                  />
                </th>
                <th className="px-3 py-2.5">Shipment</th>
                <th className="px-3 py-2.5">Users</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Order</th>
                <th className="px-3 py-2.5 text-right">Insurance</th>
                <th className="px-3 py-2.5 text-right">Fees</th>
                <th className="px-4 py-2.5 text-right">Label cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const checked = selected.includes(s.id);
                return (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-b border-ink/6 transition hover:bg-accent/8",
                      checked && "bg-accent/12"
                    )}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(s.id)}
                        aria-label={`Select shipment ${s.shipmentNumber}`}
                        className="h-4 w-4 rounded"
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <p className="font-semibold text-ink">{s.shipmentNumber}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <CarrierMark carrier={s.carrier} />
                        <span className="max-w-[220px] truncate font-mono text-[11px] text-muted">
                          {s.easyPostId}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mt-1.5 text-sm font-semibold text-primary underline-offset-2 hover:text-brand-orange hover:underline"
                        onClick={() => setLabelShipment(s)}
                      >
                        View label
                      </button>
                    </td>
                    <td className="px-3 py-3 align-top text-muted">
                      <p>
                        Created by{" "}
                        <span className="font-medium text-ink">{s.createdBy}</span>
                      </p>
                      <p>
                        Packed by{" "}
                        <span className="font-medium text-ink">{s.packedBy}</span>
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top text-ink">
                      {formatShipDate(s.shippedAt)}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={s.channel} />
                        <span className="font-medium text-ink">{s.channelOrderId}</span>
                      </div>
                      <Link
                        href={`/orders/${s.orderId}`}
                        className="mt-1.5 inline-block text-sm font-semibold text-primary underline-offset-2 hover:text-brand-orange hover:underline"
                      >
                        View order
                      </Link>
                    </td>
                    <td className="px-3 py-3 align-top text-right tabular-nums text-muted">
                      {s.insurance != null ? formatCurrency(s.insurance) : "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-right tabular-nums text-ink">
                      {formatCurrency(s.fees)}
                    </td>
                    <td className="px-4 py-3 align-top text-right font-semibold tabular-nums text-ink">
                      {formatCurrency(s.cost)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {labelShipment && (
        <ShipmentLabelModal
          shipment={labelShipment}
          onClose={() => setLabelShipment(null)}
        />
      )}

      <SectionEventLog section="shipments" />
    </div>
  );
}

export default function ShipmentsPage() {
  return (
    <RoleGate path="/shipments">
      <ShipmentsInner />
    </RoleGate>
  );
}
