import type {
  ListingChannel,
  Order,
  OrderFulfillment,
  OrderTypeKind,
  PaymentStatus,
  PickPackStatus,
  ShippingDestination,
  ShipTimeline,
} from "@/lib/types";

export type OrdersTabId =
  | "all"
  | "open"
  | "ready"
  | "not_found"
  | "overdue_urgent"
  | "being_pulled"
  | "picked"
  | "multi_ready";

export type OrdersSortKey =
  | "order-desc"
  | "order-asc"
  | "date-desc"
  | "date-asc"
  | "shipby-asc"
  | "shipby-desc"
  | "customer-asc"
  | "customer-desc"
  | "total-desc"
  | "total-asc"
  | "payment"
  | "fulfillment"
  | "location";

export type OrdersFilterState = {
  shippingMethods: string[];
  dateFrom: string;
  dateTo: string;
  pickPackStatuses: PickPackStatus[];
  channels: ListingChannel[];
  orderType: "Any" | OrderTypeKind;
  fulfillmentStatuses: OrderFulfillment[];
  categories: string[];
  locations: string[];
  paymentStatuses: PaymentStatus[];
  destination: "Any" | ShippingDestination;
  shipTimelines: ShipTimeline[];
};

export const EMPTY_ORDER_FILTERS: OrdersFilterState = {
  shippingMethods: [],
  dateFrom: "",
  dateTo: "",
  pickPackStatuses: [],
  channels: [],
  orderType: "Any",
  fulfillmentStatuses: [],
  categories: [],
  locations: [],
  paymentStatuses: [],
  destination: "Any",
  shipTimelines: [],
};

export const ORDER_SORT_OPTIONS: { id: OrdersSortKey; label: string }[] = [
  { id: "date-desc", label: "Order date · newest" },
  { id: "date-asc", label: "Order date · oldest" },
  { id: "shipby-asc", label: "Ship by · soonest" },
  { id: "shipby-desc", label: "Ship by · latest" },
  { id: "order-desc", label: "Order number · high" },
  { id: "order-asc", label: "Order number · low" },
  { id: "customer-asc", label: "Customer A–Z" },
  { id: "customer-desc", label: "Customer Z–A" },
  { id: "total-desc", label: "Total · high" },
  { id: "total-asc", label: "Total · low" },
  { id: "payment", label: "Payment status" },
  { id: "fulfillment", label: "Fulfillment status" },
  { id: "location", label: "Inventory location" },
];

export const PICK_PACK_OPTIONS: PickPackStatus[] = [
  "Not started",
  "Being pulled",
  "Picked",
  "Packed",
  "Not found",
];

export const PAYMENT_OPTIONS: PaymentStatus[] = [
  "Pending",
  "Paid",
  "Partially Paid",
  "Refunded",
  "Partially Refunded",
];

export const FULFILLMENT_OPTIONS: OrderFulfillment[] = [
  "Unfulfilled",
  "Partial",
  "Fulfilled",
];

export const SHIP_TIMELINE_OPTIONS: ShipTimeline[] = [
  "On time",
  "Urgent",
  "Overdue",
];

export const SHIPPING_METHOD_OPTIONS = [
  "Standard",
  "Expedited",
  "Priority Mail",
  "FedEx Ground",
  "Flat $9.99",
  "Local pickup",
] as const;

export function orderMatchesTab(o: Order, tab: OrdersTabId): boolean {
  switch (tab) {
    case "all":
      return true;
    case "open":
      return o.fulfillmentStatus !== "Fulfilled";
    case "ready":
      return (
        o.paymentStatus === "Paid" &&
        (o.fulfillmentStatus === "Unfulfilled" || o.fulfillmentStatus === "Partial")
      );
    case "not_found":
      return o.isNotFound;
    case "overdue_urgent":
      return o.isOverdue || o.isUrgent;
    case "being_pulled":
      return o.pickPackStatus === "Being pulled";
    case "picked":
      return o.pickPackStatus === "Picked";
    case "multi_ready":
      return (
        o.orderType === "Multi" &&
        o.pickPackStatus === "Picked" &&
        o.fulfillmentStatus !== "Fulfilled"
      );
    default:
      return true;
  }
}

export function orderShipTimeline(o: Order): ShipTimeline {
  if (o.isOverdue) return "Overdue";
  if (o.isUrgent) return "Urgent";
  return "On time";
}

export function countActiveFilters(f: OrdersFilterState): number {
  let n = 0;
  n += f.shippingMethods.length;
  if (f.dateFrom) n += 1;
  if (f.dateTo) n += 1;
  n += f.pickPackStatuses.length;
  n += f.channels.length;
  if (f.orderType !== "Any") n += 1;
  n += f.fulfillmentStatuses.length;
  n += f.categories.length;
  n += f.locations.length;
  n += f.paymentStatuses.length;
  if (f.destination !== "Any") n += 1;
  n += f.shipTimelines.length;
  return n;
}

export function filterChipLabels(f: OrdersFilterState): { key: string; label: string }[] {
  const chips: { key: string; label: string }[] = [];
  for (const m of f.shippingMethods) chips.push({ key: `ship:${m}`, label: `Ship: ${m}` });
  if (f.dateFrom) chips.push({ key: "dateFrom", label: `From ${f.dateFrom}` });
  if (f.dateTo) chips.push({ key: "dateTo", label: `To ${f.dateTo}` });
  for (const p of f.pickPackStatuses)
    chips.push({ key: `pp:${p}`, label: `Pick/pack: ${p}` });
  for (const c of f.channels) chips.push({ key: `ch:${c}`, label: `Channel: ${c}` });
  if (f.orderType !== "Any")
    chips.push({ key: "orderType", label: `Type: ${f.orderType}-item` });
  for (const s of f.fulfillmentStatuses)
    chips.push({ key: `ff:${s}`, label: `Fulfillment: ${s}` });
  for (const c of f.categories) chips.push({ key: `cat:${c}`, label: `Category: ${c}` });
  for (const l of f.locations) chips.push({ key: `loc:${l}`, label: `Location: ${l}` });
  for (const p of f.paymentStatuses)
    chips.push({
      key: `pay:${p}`,
      label: `Payment: ${p === "Pending" ? "Unpaid" : p}`,
    });
  if (f.destination !== "Any")
    chips.push({ key: "dest", label: `Destination: ${f.destination}` });
  for (const t of f.shipTimelines)
    chips.push({ key: `tl:${t}`, label: `Timeline: ${t}` });
  return chips;
}

export function removeFilterChip(
  f: OrdersFilterState,
  key: string
): OrdersFilterState {
  if (key === "dateFrom") return { ...f, dateFrom: "" };
  if (key === "dateTo") return { ...f, dateTo: "" };
  if (key === "orderType") return { ...f, orderType: "Any" };
  if (key === "dest") return { ...f, destination: "Any" };
  if (key.startsWith("ship:")) {
    const v = key.slice(5);
    return { ...f, shippingMethods: f.shippingMethods.filter((x) => x !== v) };
  }
  if (key.startsWith("pp:")) {
    const v = key.slice(3) as PickPackStatus;
    return { ...f, pickPackStatuses: f.pickPackStatuses.filter((x) => x !== v) };
  }
  if (key.startsWith("ch:")) {
    const v = key.slice(3) as ListingChannel;
    return { ...f, channels: f.channels.filter((x) => x !== v) };
  }
  if (key.startsWith("ff:")) {
    const v = key.slice(3) as OrderFulfillment;
    return {
      ...f,
      fulfillmentStatuses: f.fulfillmentStatuses.filter((x) => x !== v),
    };
  }
  if (key.startsWith("cat:")) {
    const v = key.slice(4);
    return { ...f, categories: f.categories.filter((x) => x !== v) };
  }
  if (key.startsWith("loc:")) {
    const v = key.slice(4);
    return { ...f, locations: f.locations.filter((x) => x !== v) };
  }
  if (key.startsWith("pay:")) {
    const v = key.slice(4) as PaymentStatus;
    return { ...f, paymentStatuses: f.paymentStatuses.filter((x) => x !== v) };
  }
  if (key.startsWith("tl:")) {
    const v = key.slice(3) as ShipTimeline;
    return { ...f, shipTimelines: f.shipTimelines.filter((x) => x !== v) };
  }
  return f;
}

export function applyOrderFilters(
  list: Order[],
  f: OrdersFilterState,
  q: string
): Order[] {
  const query = q.trim().toLowerCase();
  return list.filter((o) => {
    if (f.shippingMethods.length && !f.shippingMethods.includes(o.shippingMethod))
      return false;
    if (f.dateFrom && o.createdAt.slice(0, 10) < f.dateFrom) return false;
    if (f.dateTo && o.createdAt.slice(0, 10) > f.dateTo) return false;
    if (f.pickPackStatuses.length && !f.pickPackStatuses.includes(o.pickPackStatus))
      return false;
    if (f.channels.length && !f.channels.includes(o.channel)) return false;
    if (f.orderType !== "Any" && o.orderType !== f.orderType) return false;
    if (
      f.fulfillmentStatuses.length &&
      !f.fulfillmentStatuses.includes(o.fulfillmentStatus)
    )
      return false;
    if (f.categories.length && !f.categories.includes(o.category)) return false;
    if (f.locations.length && !f.locations.includes(o.location)) return false;
    if (f.paymentStatuses.length && !f.paymentStatuses.includes(o.paymentStatus))
      return false;
    if (f.destination !== "Any" && o.destination !== f.destination) return false;
    if (f.shipTimelines.length) {
      const tl = orderShipTimeline(o);
      if (!f.shipTimelines.includes(tl)) return false;
    }
    if (!query) return true;
    const hay = [
      o.orderNumber,
      o.channelOrderId,
      o.customer,
      o.title,
      o.sku,
      o.itemId,
      o.unitId,
      o.trackingNumber ?? "",
      o.channel,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(query);
  });
}

export function sortOrders(list: Order[], sort: OrdersSortKey): Order[] {
  const rows = [...list];
  rows.sort((a, b) => {
    switch (sort) {
      case "order-desc":
        return b.orderNumber.localeCompare(a.orderNumber);
      case "order-asc":
        return a.orderNumber.localeCompare(b.orderNumber);
      case "date-desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "date-asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "shipby-asc":
        return new Date(a.shipBy).getTime() - new Date(b.shipBy).getTime();
      case "shipby-desc":
        return new Date(b.shipBy).getTime() - new Date(a.shipBy).getTime();
      case "customer-asc":
        return a.customer.localeCompare(b.customer);
      case "customer-desc":
        return b.customer.localeCompare(a.customer);
      case "total-desc":
        return b.total - a.total;
      case "total-asc":
        return a.total - b.total;
      case "payment":
        return a.paymentStatus.localeCompare(b.paymentStatus);
      case "fulfillment":
        return a.fulfillmentStatus.localeCompare(b.fulfillmentStatus);
      case "location":
        return a.location.localeCompare(b.location);
      default:
        return 0;
    }
  });
  return rows;
}
