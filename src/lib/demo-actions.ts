"use client";

import {
  ORG_NAME,
  ORG_SLUG,
  autoDraftQueue,
  autoListQueue,
  listings,
  manifests,
  orders,
  products,
  refundRows,
  shipments,
} from "@/lib/mock-data";
import { downloadCsv, downloadJson, stamp } from "@/lib/download";

const KEY = "test-goodwill-demo-created";

export type CreatedProduct = {
  id: string;
  title: string;
  sku: string;
  category: string;
  supplier: string;
  price: number;
  location: string;
  description: string;
  status: "Draft" | "Active";
  imageNames: string[];
  createdAt: string;
  listedOn: string[];
};

export type CreatedListing = {
  id: string;
  productId: string;
  channel: "ShopGoodwill" | "eBay";
  title: string;
  sku: string;
  price: number;
  status: "Queued" | "Active";
  createdAt: string;
};

type Store = {
  products: CreatedProduct[];
  listings: CreatedListing[];
};

function file(prefix: string, ext: string) {
  return `${ORG_SLUG}-${prefix}-${stamp()}.${ext}`;
}

function readStore(): Store {
  if (typeof window === "undefined") return { products: [], listings: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { products: [], listings: [] };
    return JSON.parse(raw) as Store;
  } catch {
    return { products: [], listings: [] };
  }
}

function writeStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getCreatedProducts() {
  return readStore().products;
}

export function getCreatedListings() {
  return readStore().listings;
}

export function saveCreatedProduct(product: CreatedProduct) {
  const store = readStore();
  store.products = [product, ...store.products.filter((p) => p.id !== product.id)];
  writeStore(store);
  return product;
}

export function saveCreatedListing(listing: CreatedListing) {
  const store = readStore();
  store.listings = [listing, ...store.listings.filter((l) => l.id !== listing.id)];
  const product = store.products.find((p) => p.id === listing.productId);
  if (product && !product.listedOn.includes(listing.channel)) {
    product.listedOn = [...product.listedOn, listing.channel];
    product.status = "Active";
  }
  writeStore(store);
  return listing;
}

export function exportProductsCsv() {
  const created = getCreatedProducts().map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    status: p.status,
    category: p.category,
    supplier: p.supplier,
    price: p.price,
    location: p.location,
    source: "created",
  }));
  const seed = products.map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    status: p.status,
    category: p.category,
    supplier: p.supplier,
    price: p.price,
    location: p.location,
    source: "demo",
  }));
  downloadCsv(file("products", "csv"), [...created, ...seed]);
}

export function exportOrdersCsv() {
  downloadCsv(
    file("orders", "csv"),
    orders.map((o) => ({
      orderNumber: o.orderNumber,
      channel: o.channel,
      customer: o.customer,
      total: o.total,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      itemCount: o.itemCount,
      createdAt: o.createdAt,
    }))
  );
}

export function exportRefundsCsv() {
  downloadCsv(file("refunds", "csv"), refundRows as unknown as Record<string, unknown>[]);
}

export function exportManifestsCsv() {
  downloadCsv(
    file("item-batches", "csv"),
    manifests.map((m) => ({
      code: m.code,
      supplier: m.supplier,
      status: m.status,
      productCount: m.productCount,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }))
  );
}

export function exportListingsCsv(channel?: "ShopGoodwill" | "eBay") {
  const created = getCreatedListings()
    .filter((l) => !channel || l.channel === channel)
    .map((l) => ({
      id: l.id,
      channel: l.channel,
      title: l.title,
      sku: l.sku,
      price: l.price,
      status: l.status,
      source: "created",
    }));
  const seed = listings
    .filter((l) => !channel || l.channel === channel)
    .map((l) => ({
      id: l.id,
      channel: l.channel,
      title: l.title,
      sku: l.sku,
      price: l.price,
      status: l.status,
      tags: l.tags.join("; "),
      source: "demo",
    }));
  const name = channel ? channel.toLowerCase().replace(/\s/g, "-") : "all";
  downloadCsv(file(`listings-${name}`, "csv"), [...created, ...seed]);
}

export function exportShipmentsCsv() {
  downloadCsv(
    file("shipments", "csv"),
    shipments.map((s) => ({
      orderNumber: s.orderNumber,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      cost: s.cost,
      status: s.status,
      shippedAt: s.shippedAt,
    }))
  );
}

export function exportAutoDraftQueueCsv() {
  downloadCsv(
    file("auto-draft-queue", "csv"),
    autoDraftQueue.map((r) => ({
      sku: r.sku,
      title: r.title,
      category: r.category,
      suggestedPrice: r.suggestedPrice,
      confidence: r.confidence,
      source: r.source,
      generatedAt: r.generatedAt,
    }))
  );
}

export function exportAutoListQueueCsv() {
  downloadCsv(
    file("auto-list-queue", "csv"),
    autoListQueue.map((r) => ({
      sku: r.sku,
      title: r.title,
      channel: r.channel,
      price: r.price,
      readiness: r.readiness,
      generatedAt: r.generatedAt,
    }))
  );
}

export function exportAllDemoJson() {
  downloadJson(file("full-export", "json"), {
    organization: ORG_NAME,
    slug: ORG_SLUG,
    exportedAt: new Date().toISOString(),
    products,
    listings,
    orders,
    shipments,
    manifests,
    refunds: refundRows,
    autoDraftQueue,
    autoListQueue,
    created: readStore(),
  });
}

export function exportBarcodesTxt(skus: string[]) {
  const body = skus.map((sku, i) => `${i + 1}. ${sku}`).join("\n");
  downloadTextSafe(
    file("barcodes", "txt"),
    `${ORG_NAME} barcode sheet\nGenerated: ${new Date().toLocaleString()}\n\n${body}\n`
  );
}

function downloadTextSafe(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportListingPacket(listing: {
  title: string;
  sku: string;
  channel: string;
  price: number;
  category?: string;
  description?: string;
  images?: string[];
}) {
  downloadJson(file(`listing-${listing.sku || "draft"}`, "json"), {
    organization: ORG_NAME,
    ...listing,
    generatedAt: new Date().toISOString(),
    note: "Demo listing packet — ready to hand off or import later.",
  });
  downloadCsv(file(`listing-${listing.sku || "draft"}`, "csv"), [
    {
      organization: ORG_NAME,
      title: listing.title,
      sku: listing.sku,
      channel: listing.channel,
      price: listing.price,
      category: listing.category ?? "",
      description: listing.description ?? "",
      images: (listing.images ?? []).join("; "),
    },
  ]);
}
