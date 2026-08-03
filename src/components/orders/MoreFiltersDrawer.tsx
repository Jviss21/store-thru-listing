"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui";
import { CATEGORIES } from "@/lib/mock-data";
import {
  EMPTY_ORDER_FILTERS,
  FULFILLMENT_OPTIONS,
  PAYMENT_OPTIONS,
  PICK_PACK_OPTIONS,
  SHIP_TIMELINE_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  type OrdersFilterState,
} from "@/lib/orders-filters";
import type { ListingChannel, Order } from "@/lib/types";
import { cn } from "@/lib/utils";

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-ink/8">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-semibold text-ink hover:text-ink/80"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="space-y-2 pb-3 pl-1">{children}</div>}
    </div>
  );
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-ink/25 accent-[var(--ink)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function toggleIn<T extends string>(list: T[], value: T, on: boolean): T[] {
  if (on) return list.includes(value) ? list : [...list, value];
  return list.filter((x) => x !== value);
}

export function MoreFiltersDrawer({
  open,
  draft,
  onChange,
  onApply,
  onClear,
  onClose,
  locationOptions,
}: {
  open: boolean;
  draft: OrdersFilterState;
  onChange: (next: OrdersFilterState) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  locationOptions: string[];
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shipping: true,
    date: false,
    pickPack: true,
    channel: false,
    orderType: false,
    fulfillment: false,
    category: false,
    location: false,
    payment: false,
    destination: false,
    timeline: true,
  });

  if (!open) return null;

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close filters"
        className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-ink/10 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">More filters</h2>
            <p className="text-xs text-muted">Refine the orders list</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted hover:bg-mist hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <Accordion
            title="Shipping method"
            open={!!openSections.shipping}
            onToggle={() => toggleSection("shipping")}
          >
            {SHIPPING_METHOD_OPTIONS.map((m) => (
              <CheckRow
                key={m}
                label={m}
                checked={draft.shippingMethods.includes(m)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    shippingMethods: toggleIn(draft.shippingMethods, m, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="Date"
            open={!!openSections.date}
            onToggle={() => toggleSection("date")}
          >
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Ordered from
              <input
                type="date"
                className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-normal normal-case text-ink"
                value={draft.dateFrom}
                onChange={(e) => onChange({ ...draft, dateFrom: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Ordered to
              <input
                type="date"
                className="h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-normal normal-case text-ink"
                value={draft.dateTo}
                onChange={(e) => onChange({ ...draft, dateTo: e.target.value })}
              />
            </label>
          </Accordion>

          <Accordion
            title="Pick and pack status"
            open={!!openSections.pickPack}
            onToggle={() => toggleSection("pickPack")}
          >
            {PICK_PACK_OPTIONS.map((p) => (
              <CheckRow
                key={p}
                label={p}
                checked={draft.pickPackStatuses.includes(p)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    pickPackStatuses: toggleIn(draft.pickPackStatuses, p, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="Channel"
            open={!!openSections.channel}
            onToggle={() => toggleSection("channel")}
          >
            {(["eBay", "ShopGoodwill"] as ListingChannel[]).map((c) => (
              <CheckRow
                key={c}
                label={c}
                checked={draft.channels.includes(c)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    channels: toggleIn(draft.channels, c, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="Order type"
            open={!!openSections.orderType}
            onToggle={() => toggleSection("orderType")}
          >
            {(
              [
                ["Any", "Any"],
                ["Single", "Single-item orders"],
                ["Multi", "Multi-item orders"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink"
              >
                <input
                  type="radio"
                  name="orderType"
                  className="h-4 w-4 accent-[var(--ink)]"
                  checked={draft.orderType === value}
                  onChange={() => onChange({ ...draft, orderType: value })}
                />
                {label}
              </label>
            ))}
          </Accordion>

          <Accordion
            title="Fulfillment status"
            open={!!openSections.fulfillment}
            onToggle={() => toggleSection("fulfillment")}
          >
            {FULFILLMENT_OPTIONS.map((s) => (
              <CheckRow
                key={s}
                label={s}
                checked={draft.fulfillmentStatuses.includes(s)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    fulfillmentStatuses: toggleIn(draft.fulfillmentStatuses, s, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="By category"
            open={!!openSections.category}
            onToggle={() => toggleSection("category")}
          >
            {CATEGORIES.map((c) => (
              <CheckRow
                key={c}
                label={c}
                checked={draft.categories.includes(c)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    categories: toggleIn(draft.categories, c, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="In location"
            open={!!openSections.location}
            onToggle={() => toggleSection("location")}
          >
            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {locationOptions.map((loc) => (
                <CheckRow
                  key={loc}
                  label={loc}
                  checked={draft.locations.includes(loc)}
                  onChange={(on) =>
                    onChange({
                      ...draft,
                      locations: toggleIn(draft.locations, loc, on),
                    })
                  }
                />
              ))}
            </div>
          </Accordion>

          <Accordion
            title="Payment status"
            open={!!openSections.payment}
            onToggle={() => toggleSection("payment")}
          >
            {PAYMENT_OPTIONS.map((p) => (
              <CheckRow
                key={p}
                label={p === "Pending" ? "Unpaid" : p}
                checked={draft.paymentStatuses.includes(p)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    paymentStatuses: toggleIn(draft.paymentStatuses, p, on),
                  })
                }
              />
            ))}
          </Accordion>

          <Accordion
            title="Shipping destination"
            open={!!openSections.destination}
            onToggle={() => toggleSection("destination")}
          >
            {(
              [
                ["Any", "All destinations"],
                ["Domestic", "Domestic"],
                ["International", "International"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-ink"
              >
                <input
                  type="radio"
                  name="destination"
                  className="h-4 w-4 accent-[var(--ink)]"
                  checked={draft.destination === value}
                  onChange={() => onChange({ ...draft, destination: value })}
                />
                {label}
              </label>
            ))}
          </Accordion>

          <Accordion
            title="Ship timeline"
            open={!!openSections.timeline}
            onToggle={() => toggleSection("timeline")}
          >
            {SHIP_TIMELINE_OPTIONS.map((t) => (
              <CheckRow
                key={t}
                label={t}
                checked={draft.shipTimelines.includes(t)}
                onChange={(on) =>
                  onChange({
                    ...draft,
                    shipTimelines: toggleIn(draft.shipTimelines, t, on),
                  })
                }
              />
            ))}
          </Accordion>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink/8 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onChange(EMPTY_ORDER_FILTERS);
              onClear();
            }}
          >
            Clear filters
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="button" variant="accent" onClick={onApply}>
              Apply filters
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function uniqueOrderLocations(orders: Order[]): string[] {
  return Array.from(new Set(orders.map((o) => o.location))).sort();
}
