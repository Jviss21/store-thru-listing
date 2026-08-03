import {
  autoListQueue,
  listings,
  manifests,
  orders,
  products,
  refundRows,
  shipments,
} from "@/lib/mock-data";
import { inDateRange } from "@/lib/report-dates";
import { getCreatedListings, getCreatedProducts } from "@/lib/demo-actions";

function filterByCreatedAt<T extends { createdAt?: string; postedAt?: string; shippedAt?: string; refundedAt?: string }>(
  rows: T[],
  start: string,
  end: string,
  field: keyof T = "createdAt" as keyof T
) {
  return rows.filter((r) => {
    const raw = String(r[field] ?? "");
    if (!raw) return true;
    return inDateRange(raw, start, end);
  });
}

export function rowsShopgoodwillListings(start: string, end: string) {
  const seed = listings.filter((l) => l.channel === "ShopGoodwill");
  const created =
    typeof window !== "undefined"
      ? getCreatedListings().filter((l) => l.channel === "ShopGoodwill")
      : [];
  return [
    ...created.map((l) => ({
      id: l.id,
      sku: l.sku,
      title: l.title,
      channel: l.channel,
      price: l.price,
      status: l.status,
      createdAt: l.createdAt,
    })),
    ...filterByCreatedAt(seed, start, end, "postedAt").map((l) => ({
      id: l.id,
      sku: l.sku,
      title: l.title,
      channel: l.channel,
      price: l.price,
      status: l.status,
      createdAt: l.postedAt,
      supplier: l.supplier,
    })),
  ] as Record<string, unknown>[];
}

export function rowsEbayListings(start: string, end: string) {
  const seed = listings.filter((l) => l.channel === "eBay");
  const created =
    typeof window !== "undefined"
      ? getCreatedListings().filter((l) => l.channel === "eBay")
      : [];
  return [
    ...created.map((l) => ({
      id: l.id,
      sku: l.sku,
      title: l.title,
      channel: l.channel,
      price: l.price,
      status: l.status,
      createdAt: l.createdAt,
    })),
    ...filterByCreatedAt(seed, start, end, "postedAt").map((l) => ({
      id: l.id,
      sku: l.sku,
      title: l.title,
      channel: l.channel,
      price: l.price,
      status: l.status,
      createdAt: l.postedAt,
      supplier: l.supplier,
    })),
  ] as Record<string, unknown>[];
}

export function rowsOrders(start: string, end: string, paymentStatus?: string) {
  let rows = filterByCreatedAt(orders, start, end, "createdAt");
  if (paymentStatus && paymentStatus !== "All") {
    rows = rows.filter((o) => o.paymentStatus === paymentStatus);
  }
  return rows.map((o) => ({
    orderNumber: o.orderNumber,
    customer: o.customer,
    channel: o.channel,
    total: o.total,
    paymentStatus: o.paymentStatus,
    fulfillmentStatus: o.fulfillmentStatus,
    createdAt: o.createdAt,
  })) as Record<string, unknown>[];
}

export function rowsPaidOrderItems(
  start: string,
  end: string,
  filters: { channel?: string; paymentStatus?: string }
) {
  const paid = rowsOrders(start, end, filters.paymentStatus ?? "Paid");
  return paid
    .filter((o) => {
      if (!filters.channel || filters.channel === "All") return true;
      return o.channel === filters.channel;
    })
    .flatMap((o, i) => [
      {
        orderNumber: o.orderNumber,
        line: 1,
        sku: `TGW${1000 + i}`,
        title: `Line item for ${o.orderNumber}`,
        qty: 1,
        unitPrice: o.total,
        channel: o.channel,
        paymentStatus: o.paymentStatus,
        paidAt: o.createdAt,
      },
    ]) as Record<string, unknown>[];
}

export function rowsRefunds(start: string, end: string) {
  return filterByCreatedAt(refundRows, start, end, "refundedAt").map((r) => ({
    orderNumber: r.orderNumber,
    customer: r.customer,
    channel: r.channel,
    total: r.total,
    reason: r.reason,
    status: r.status,
    refundedAt: r.refundedAt,
  })) as Record<string, unknown>[];
}

export function rowsManifestItems(start: string, end: string) {
  return filterByCreatedAt(manifests, start, end, "createdAt").map((m) => ({
    code: m.code,
    supplier: m.supplier,
    status: m.status,
    itemCount: m.productCount,
    createdBy: m.createdBy,
    createdAt: m.createdAt,
  })) as Record<string, unknown>[];
}

export function rowsShipments(start: string, end: string) {
  return filterByCreatedAt(shipments, start, end, "shippedAt").map((s) => ({
    orderNumber: s.orderNumber,
    carrier: s.carrier,
    trackingNumber: s.trackingNumber,
    cost: s.cost,
    status: s.status,
    shippedAt: s.shippedAt,
  })) as Record<string, unknown>[];
}

export function rowsProducts(start: string, end: string) {
  const created =
    typeof window !== "undefined"
      ? getCreatedProducts().map((p) => ({
          sku: p.sku,
          title: p.title,
          category: p.category,
          supplier: p.supplier,
          price: p.price,
          status: p.status,
          createdAt: p.createdAt,
        }))
      : [];
  const seed = filterByCreatedAt(products, start, end, "createdAt").map((p) => ({
    sku: p.sku,
    title: p.title,
    category: p.category,
    supplier: p.supplier,
    price: p.price,
    status: p.status,
    createdAt: p.createdAt,
  }));
  return [...created, ...seed] as Record<string, unknown>[];
}

export function rowsAutoListQueue() {
  return autoListQueue.map((r) => ({
    sku: r.sku,
    title: r.title,
    channel: r.channel,
    price: r.price,
    readiness: r.readiness,
    generatedAt: r.generatedAt,
  })) as Record<string, unknown>[];
}
