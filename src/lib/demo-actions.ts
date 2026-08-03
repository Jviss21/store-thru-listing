"use client";

import {
  ORG_NAME,
  ORG_SLUG,
  autoListQueue,
  eventLogRows,
  getListing,
  getProduct,
  listings,
  listerProductivity,
  manifestReportRows,
  manifests,
  operationalActivity,
  orders,
  products,
  refundRows,
  shipments,
  supplierReportRows,
  top50Sales,
} from "@/lib/mock-data";
import { downloadCsv, downloadJson, stamp } from "@/lib/download";
import { getStrategyByName } from "@/lib/listing-strategies";
import { productPhotoUrls } from "@/lib/photos";
import type { EbayListingInputPack, Listing } from "@/lib/types";

const KEY = "test-goodwill-demo-created";

export type CreatedProduct = {
  id: string;
  title: string;
  sku: string;
  category: string;
  categoryPath?: string;
  supplier: string;
  price: number;
  location: string;
  description: string;
  privateDescription?: string;
  status: "Draft" | "Active";
  imageNames: string[];
  imageUrls: string[];
  createdAt: string;
  listedOn: string[];
  condition?: string;
  brand?: string;
  carrier?: string;
  strategy?: string;
  tags?: string[];
  weightLbs?: number;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
  mpn?: string;
  upc?: string;
  subtitle?: string;
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

export function updateCreatedProductPhotos(productId: string, imageUrls: string[], imageNames: string[]) {
  const store = readStore();
  const product = store.products.find((p) => p.id === productId);
  if (!product) return null;
  product.imageUrls = imageUrls;
  product.imageNames = imageNames;
  writeStore(store);
  return product;
}

/** Persist uploaded photos for seed products in localStorage overlay. */
const PHOTO_OVERLAY_KEY = "test-goodwill-demo-photos";

export function getPhotoOverlay(productId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PHOTO_OVERLAY_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, string[]>;
    return map[productId] ?? [];
  } catch {
    return [];
  }
}

export function setPhotoOverlay(productId: string, urls: string[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PHOTO_OVERLAY_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    map[productId] = urls;
    localStorage.setItem(PHOTO_OVERLAY_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function exportProductsCsv() {
  const created = getCreatedProducts().map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    status: p.status,
    category: p.category,
    categoryPath: p.categoryPath ?? p.category,
    supplier: p.supplier,
    price: p.price,
    location: p.location,
    condition: p.condition ?? "",
    brand: p.brand ?? "",
    carrier: p.carrier ?? "",
    strategy: p.strategy ?? "",
    tags: (p.tags ?? []).join("; "),
    photoCount: p.imageUrls?.length ?? p.imageNames.length,
    source: "created",
  }));
  const seed = products.map((p) => ({
    id: p.id,
    title: p.title,
    sku: p.sku,
    status: p.status,
    category: p.category,
    categoryPath: p.categoryPath,
    supplier: p.supplier,
    price: p.price,
    location: p.location,
    condition: p.condition ?? "",
    brand: p.brand ?? "",
    carrier: p.carrier ?? "",
    strategy: p.strategy ?? "",
    tags: (p.tags ?? []).join("; "),
    uprightProductId: p.uprightProductId ?? "",
    photoCount: p.imageUrls.length,
    source: "demo",
  }));
  downloadCsv(file("products", "csv"), [...created, ...seed]);
}

export function exportOrdersCsv(opts?: { paymentStatus?: "Paid" | "Pending" | "Refunded" }) {
  const rows = orders
    .filter((o) => !opts?.paymentStatus || o.paymentStatus === opts.paymentStatus)
    .map((o) => ({
      orderNumber: o.orderNumber,
      channel: o.channel,
      customer: o.customer,
      total: o.total,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      itemCount: o.itemCount,
      createdAt: o.createdAt,
    }));
  const suffix = opts?.paymentStatus ? opts.paymentStatus.toLowerCase() : "all";
  downloadCsv(file(`orders-${suffix}`, "csv"), rows);
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
      uprightProductId: l.uprightProductId,
      sku: l.sku,
      tags: l.tags.join("; "),
      strategy: l.strategy,
      externalId: l.externalId,
      title: l.title,
      privateDescription: l.privateDescription,
      inventoryLocation: l.location,
      supplier: l.supplier,
      carrier: l.carrier,
      categoryPath: l.categoryPath,
      status: l.status,
      price: l.price,
      condition: l.condition,
      brand: l.brand,
      channel: l.channel,
      createdAt: l.postedAt,
      productCreatedAt: l.productCreatedAt,
      photoUrls: l.imageUrls.join("; "),
      source: "demo",
    }));
  const name = channel ? channel.toLowerCase().replace(/\s/g, "-") : "all";
  downloadCsv(file(`listings-${name}`, "csv"), [...created, ...seed]);
}

export function exportShipmentsCsv() {
  downloadCsv(
    file("shipments", "csv"),
    shipments.map((s) => ({
      shipmentNumber: s.shipmentNumber,
      orderNumber: s.orderNumber,
      channelOrderId: s.channelOrderId,
      channel: s.channel,
      carrier: s.carrier,
      trackingNumber: s.trackingNumber,
      easyPostId: s.easyPostId,
      cost: s.cost,
      fees: s.fees,
      insurance: s.insurance ?? "",
      createdBy: s.createdBy,
      packedBy: s.packedBy,
      status: s.status,
      shippedAt: s.shippedAt,
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

export function exportProductivityCsv() {
  downloadCsv(
    file("productivity", "csv"),
    listerProductivity as unknown as Record<string, unknown>[]
  );
}

export function exportOperationalCsv() {
  downloadCsv(
    file("operational", "csv"),
    operationalActivity as unknown as Record<string, unknown>[]
  );
}

export function exportEventsCsv() {
  downloadCsv(file("event-logs", "csv"), eventLogRows as unknown as Record<string, unknown>[]);
}

export function exportItemCreationCsv() {
  downloadCsv(
    file("item-creation", "csv"),
    manifestReportRows as unknown as Record<string, unknown>[]
  );
}

export function exportTopSalesCsv() {
  downloadCsv(file("top-sales", "csv"), top50Sales as unknown as Record<string, unknown>[]);
}

export function exportSuppliersCsv() {
  downloadCsv(
    file("suppliers", "csv"),
    supplierReportRows.map((row) => ({
      name: row.name,
      amount: row.amount,
      itemsListed: row.itemsListed,
      itemsSold: row.itemsSold,
      avgDaysToSell: row.avgDaysToSell,
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
    autoListQueue,
    listerProductivity,
    operationalActivity,
    eventLogRows,
    manifestReportRows,
    top50Sales,
    supplierReportRows: supplierReportRows.map((row) => ({
      name: row.name,
      amount: row.amount,
      itemsListed: row.itemsListed,
      itemsSold: row.itemsSold,
      avgDaysToSell: row.avgDaysToSell,
      spark: row.spark,
    })),
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

function buildEbayPackFromListing(listing: Listing): EbayListingInputPack {
  return {
    organization: ORG_NAME,
    channel: "eBay",
    title: listing.title,
    subtitle: listing.subtitle ?? "",
    description: listing.description,
    condition: listing.condition,
    conditionDescription: listing.conditionDescription ?? "",
    category: listing.categoryPath.split(" > ").pop() ?? listing.categoryPath,
    categoryPath: listing.categoryPath,
    ebayCategoryId: listing.ebayCategoryId ?? "",
    listingType: listing.listingType ?? "Auction",
    listingDuration: listing.listingDuration ?? "7 Days",
    startTime: listing.startTime ?? "Immediately",
    startingPrice: listing.startingPrice ?? listing.price,
    buyItNowPrice: listing.buyItNowPrice ?? 0,
    reservePrice: listing.reservePrice ?? 0,
    handlingTimeDays: listing.handlingTimeDays ?? 2,
    allowBestOffer: listing.allowBestOffer ?? false,
    itemSpecifics: Object.entries(listing.itemSpecifics)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
    brand: listing.brand,
    mpn: listing.mpn ?? "",
    upc: listing.upc ?? "",
    price: listing.price,
    quantity: listing.quantity,
    sku: listing.sku,
    photoUrls: listing.imageUrls.join("; "),
    mainImageIndex: listing.mainImageIndex ?? 0,
    shippingPolicy: listing.shippingPolicy,
    shippingMethod: listing.shippingMethod ?? listing.carrier,
    shippingBox: listing.shippingBox ?? "",
    shippingWeightLbs: listing.shippingWeightLbs ?? listing.weightLbs,
    weightLbs: listing.weightLbs,
    lengthIn: listing.lengthIn,
    widthIn: listing.widthIn,
    heightIn: listing.heightIn,
    dimUnit: listing.dimUnit ?? "IN",
    boxPadding: listing.boxPadding ?? "",
    returnsPolicy: listing.returnsPolicy,
    paymentPolicy: listing.paymentPolicy,
    itemLocation: listing.itemLocation,
    privateDescription: listing.privateDescription,
    productNotes: listing.productNotes ?? "",
    inventoryLocation: listing.location,
    supplier: listing.supplier,
    carrier: listing.carrier,
    strategy: listing.strategy,
    tags: listing.tags.join("; "),
    uprightProductId: listing.uprightProductId,
    externalId: listing.externalId,
    status: listing.status,
    bids: listing.bids ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

function buildEbayPackFromPartial(input: {
  title: string;
  sku: string;
  channel: string;
  price: number;
  category?: string;
  description?: string;
  images?: string[];
  listingId?: string;
  productId?: string;
}): EbayListingInputPack {
  const listing = input.listingId
    ? getListing(input.listingId)
    : listings.find((l) => l.sku === input.sku && l.channel === "eBay") ??
      listings.find((l) => l.sku === input.sku);
  if (listing) {
    const pack = buildEbayPackFromListing(listing);
    if (input.channel !== "eBay") {
      return { ...pack, channel: "eBay", title: input.title, price: input.price };
    }
    return pack;
  }
  const product =
    (input.productId ? getProduct(input.productId) : undefined) ?? getProduct(input.sku);
  const photos =
    input.images?.length && input.images.every((u) => u.startsWith("http") || u.startsWith("data:"))
      ? input.images
      : product?.imageUrls ?? productPhotoUrls(input.sku || "draft", 4);
  const specifics: Record<string, string> = {
    Brand: product?.brand ?? "Unbranded",
    Condition: product?.condition ?? "Used - Good",
  };
  if (product?.mpn) specifics.MPN = product.mpn;
  if (product?.upc) specifics.UPC = product.upc;
  // Auto-List: strategy fills channel payload defaults when product fields are blank/zero.
  const strategy = getStrategyByName(product?.strategy ?? "");
  const weightLbs =
    product?.weightLbs && product.weightLbs > 0
      ? product.weightLbs
      : strategy?.defaultWeightLbs ?? 1;
  const shippingWeight =
    product?.shippingWeightLbs && product.shippingWeightLbs > 0
      ? product.shippingWeightLbs
      : strategy?.shippingWeightLbs ?? weightLbs;
  return {
    organization: ORG_NAME,
    channel: "eBay",
    title: input.title,
    subtitle: product?.subtitle ?? "",
    description: input.description || product?.description || "",
    condition: product?.condition ?? "Used - Good",
    conditionDescription: product?.conditionDescription ?? "",
    category: input.category || product?.category || "",
    categoryPath: product?.categoryPath || input.category || "",
    ebayCategoryId: product?.ebayCategoryId ?? "",
    listingType: product?.listingType ?? strategy?.listingType ?? "Fixed Price",
    listingDuration: product?.listingDuration ?? strategy?.listingDuration ?? "GTC",
    startTime: product?.startTime ?? strategy?.startTime ?? "Immediately",
    startingPrice: product?.startingPrice ?? strategy?.startingPrice ?? input.price,
    buyItNowPrice: product?.buyItNowPrice ?? strategy?.buyItNowPrice ?? 0,
    reservePrice: product?.reservePrice ?? strategy?.reservePrice ?? 0,
    handlingTimeDays: product?.handlingTimeDays ?? strategy?.handlingTimeDays ?? 2,
    allowBestOffer: product?.allowBestOffer ?? strategy?.allowBestOffer ?? false,
    itemSpecifics: Object.entries(specifics)
      .map(([k, v]) => `${k}=${v}`)
      .join("; "),
    brand: product?.brand ?? "Unbranded",
    mpn: product?.mpn ?? "",
    upc: product?.upc ?? "",
    price: input.price,
    quantity: Math.max(1, strategy?.stockQuantity ?? 1),
    sku: input.sku,
    photoUrls: photos.join("; "),
    mainImageIndex: product?.mainImageIndex ?? 0,
    shippingPolicy:
      product?.shippingPolicy ?? strategy?.shippingPolicy ?? `${product?.carrier ?? "FedEx"} Ground · Calculated`,
    shippingMethod: product?.shippingMethod ?? product?.carrier ?? strategy?.shippingMethod ?? "FedEx",
    shippingBox: product?.shippingBox || strategy?.shippingBox || "Medium Box",
    shippingWeightLbs: shippingWeight,
    weightLbs,
    lengthIn: product?.lengthIn && product.lengthIn > 0 ? product.lengthIn : strategy?.lengthIn ?? 10,
    widthIn: product?.widthIn && product.widthIn > 0 ? product.widthIn : strategy?.widthIn ?? 8,
    heightIn: product?.heightIn && product.heightIn > 0 ? product.heightIn : strategy?.heightIn ?? 4,
    dimUnit: product?.dimUnit ?? strategy?.dimUnit ?? "IN",
    boxPadding: product?.boxPadding || strategy?.boxPadding || "1 inch",
    returnsPolicy:
      product?.returnsPolicy ?? strategy?.returnsPolicy ?? "30-day returns · Buyer pays return shipping",
    paymentPolicy:
      product?.paymentPolicy ?? strategy?.paymentPolicy ?? "Managed payments (eBay / marketplace default)",
    itemLocation: "Test Goodwill · Anonymized Demo Facility, USA",
    privateDescription: product?.privateDescription ?? input.sku,
    productNotes: product?.productNotes ?? "",
    inventoryLocation: product?.location ?? "",
    supplier: product?.supplier ?? "",
    carrier: product?.carrier ?? strategy?.carrier ?? "FedEx",
    strategy: product?.strategy ?? strategy?.name ?? input.category ?? "",
    tags: (product?.tags ?? []).join("; "),
    uprightProductId: product?.uprightProductId ?? "",
    externalId: "",
    status: "Queued",
    bids: 0,
    generatedAt: new Date().toISOString(),
  };
}

/** Full eBay listing input pack (CSV + JSON) with all required marketplace fields. */
export function exportEbayListingPack(
  input:
    | Listing
    | {
        title: string;
        sku: string;
        channel: string;
        price: number;
        category?: string;
        description?: string;
        images?: string[];
        listingId?: string;
        productId?: string;
      }
) {
  const pack: EbayListingInputPack =
    "imageUrls" in input && "itemSpecifics" in input
      ? buildEbayPackFromListing(input)
      : buildEbayPackFromPartial(input);

  downloadJson(file(`ebay-listing-pack-${pack.sku || "draft"}`, "json"), {
    ...pack,
    itemSpecificsObject:
      "itemSpecifics" in input && typeof input.itemSpecifics === "object"
        ? input.itemSpecifics
        : Object.fromEntries(
            pack.itemSpecifics
              .split("; ")
              .filter(Boolean)
              .map((pair) => {
                const i = pair.indexOf("=");
                return i >= 0 ? [pair.slice(0, i), pair.slice(i + 1)] : [pair, ""];
              })
          ),
    photoUrlList: pack.photoUrls.split("; ").filter(Boolean),
    note: "Complete eBay listing input pack for Test Goodwill demo — ready to import or hand off.",
  });
  downloadCsv(file(`ebay-listing-pack-${pack.sku || "draft"}`, "csv"), [
    pack as unknown as Record<string, unknown>,
  ]);
}

/** Generic listing packet (SGW or eBay). eBay gets the full input pack. */
export function exportListingPacket(listing: {
  title: string;
  sku: string;
  channel: string;
  price: number;
  category?: string;
  description?: string;
  images?: string[];
  listingId?: string;
  productId?: string;
}) {
  if (listing.channel === "eBay") {
    exportEbayListingPack(listing);
    return;
  }
  const product = listing.productId
    ? getProduct(listing.productId)
    : getProduct(listing.sku);
  const seedListing = listings.find(
    (l) => l.sku === listing.sku && l.channel === "ShopGoodwill"
  );
  const photos =
    listing.images?.length &&
    listing.images.every((u) => u.startsWith("http") || u.startsWith("data:"))
      ? listing.images
      : seedListing?.imageUrls ?? product?.imageUrls ?? productPhotoUrls(listing.sku, 3);

  downloadJson(file(`listing-${listing.sku || "draft"}`, "json"), {
    organization: ORG_NAME,
    channel: listing.channel,
    title: listing.title,
    subtitle: product?.subtitle ?? seedListing?.subtitle ?? "",
    description: listing.description || product?.description || seedListing?.description || "",
    condition: product?.condition ?? seedListing?.condition ?? "Used - Good",
    category: listing.category ?? product?.category ?? "",
    categoryPath: product?.categoryPath ?? seedListing?.categoryPath ?? listing.category ?? "",
    sku: listing.sku,
    price: listing.price,
    quantity: 1,
    privateDescription: product?.privateDescription ?? seedListing?.privateDescription ?? "",
    inventoryLocation: product?.location ?? seedListing?.location ?? "",
    supplier: product?.supplier ?? seedListing?.supplier ?? "",
    carrier: product?.carrier ?? seedListing?.carrier ?? "",
    strategy: product?.strategy ?? seedListing?.strategy ?? listing.category ?? "",
    tags: product?.tags ?? seedListing?.tags ?? [],
    uprightProductId: product?.uprightProductId ?? seedListing?.uprightProductId ?? "",
    externalId: seedListing?.externalId ?? "",
    brand: product?.brand ?? seedListing?.brand ?? "",
    mpn: product?.mpn ?? seedListing?.mpn ?? "",
    upc: product?.upc ?? seedListing?.upc ?? "",
    weightLbs: product?.weightLbs ?? seedListing?.weightLbs ?? 1,
    lengthIn: product?.lengthIn ?? seedListing?.lengthIn ?? 10,
    widthIn: product?.widthIn ?? seedListing?.widthIn ?? 8,
    heightIn: product?.heightIn ?? seedListing?.heightIn ?? 4,
    photoUrls: photos,
    generatedAt: new Date().toISOString(),
    note: "Demo ShopGoodwill listing packet — ready to hand off or import later.",
  });
  downloadCsv(file(`listing-${listing.sku || "draft"}`, "csv"), [
    {
      organization: ORG_NAME,
      channel: listing.channel,
      title: listing.title,
      sku: listing.sku,
      price: listing.price,
      category: listing.category ?? "",
      categoryPath: product?.categoryPath ?? "",
      description: listing.description ?? "",
      condition: product?.condition ?? "",
      privateDescription: product?.privateDescription ?? "",
      inventoryLocation: product?.location ?? "",
      supplier: product?.supplier ?? "",
      carrier: product?.carrier ?? "",
      strategy: product?.strategy ?? "",
      tags: (product?.tags ?? []).join("; "),
      brand: product?.brand ?? "",
      photoUrls: photos.join("; "),
    },
  ]);
}
