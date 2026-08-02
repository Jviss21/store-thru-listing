import type {
  Listing,
  ListingChannel,
  ListingStatus,
  Manifest,
  ManifestStatus,
  Order,
  Product,
  ProductStatus,
  Shipment,
} from "./types";

/** Single front-end customer for this demo. */
export const ORG_NAME = "Test Goodwill";
export const ORG_SLUG = "test-goodwill";
export const BRAND = {
  product: "hammoq",
  ai: "Infinity AI",
  autoDraft: "Auto-Draft",
  autoList: "Auto-List",
};

export const CURRENT_USER = {
  name: "John Doe",
  email: "john.doe@testgoodwill.example",
  handle: "jdoe",
  role: "Ops Lead",
};

export const SUPPLIERS = Array.from({ length: 12 }, (_, i) => `Supplier ${i + 1}`);

export const CATEGORIES = [
  "Home Goods",
  "Electronics",
  "Sports",
  "Books & Media",
  "Apparel",
  "General Merchandise",
  "Toys & Games",
  "Jewelry & Accessories",
  "Tools & Hardware",
  "Collectibles",
];

export const REJECT_REASONS = [
  "Damaged/Broken/Torn",
  "Low Value",
  "Too Heavy/Bulky/Can't Ship",
  "Prohibited item",
  "Counterfeit",
  "Do Not Send List",
  "Contaminated/Biohazard",
  "Bundling",
];

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

const COLORS = [
  "#2563eb",
  "#0f766e",
  "#ea580c",
  "#7c3aed",
  "#dc2626",
  "#1d4ed8",
  "#334155",
  "#c8f135",
  "#0891b2",
  "#be185d",
];

const STAFF = [
  { name: "John Doe", handle: "jdoe" },
  { name: "Jane Smith", handle: "jsmith" },
  { name: "Alice Jones", handle: "ajones" },
  { name: "Bob Wilson", handle: "bwilson" },
  { name: "Mike Brown", handle: "mbrown" },
  { name: "Sara Lee", handle: "slee" },
  { name: "Chris Taylor", handle: "ctaylor" },
  { name: "Pat Morgan", handle: "pmorgan" },
];

const MANIFEST_STATUSES: ManifestStatus[] = [
  "Created",
  "Ready for Pickup",
  "In Transit",
  "Received",
  "Partially Processed",
  "Processed",
  "Missing",
];

const PRODUCT_STATUSES: ProductStatus[] = ["Active", "Draft", "Recycled"];
const LISTING_STATUSES: ListingStatus[] = [
  "Queued",
  "Active",
  "Unpaid",
  "Sold",
  "Expired",
  "Delisted",
  "Recycled",
  "Additional QA Required",
];

export const infinityStats = {
  autoDraftedToday: 214,
  autoListedToday: 168,
  aiSuggestedTitles: 392,
  aiCategoryMatchRate: 94,
  pendingAiReview: 47,
};

export const dashboardStats = {
  salesYesterday: 48210.55,
  paidOrdersYesterday: 512,
  salesSpark: [22, 24, 21, 29, 34, 31, 38, 36, 42, 44, 48, 51],
  unfulfilledOrders: 186,
  unprocessedManifestItems: 12440,
  openManifests: 148,
  pendingShopgoodwill: 204,
  pendingEbay: 97,
  purgeable: 312,
  failedListings: 28,
  failedAccount: "test_goodwill_sgw",
};

export const todayPostings = STAFF.map((s, i) => ({
  user: s.handle,
  count: 96 - i * 9,
  change: [14, -6, 8, 21, -3, 11, 4, 0][i],
}));

export const weeklySupplierSales = SUPPLIERS.slice(0, 8).map((name, i) => ({
  name,
  amount: Math.round((18000 - i * 1850 + (i % 3) * 220) * 100) / 100,
  spark: [8, 9, 10, 11, 12, 13, 14].map((n) => n + ((i * 2) % 5)),
}));

export const weeklyPosterSales = STAFF.slice(0, 6).map((s, i) => ({
  user: s.handle,
  amount: Math.round((11000 - i * 1200) * 100) / 100,
  spark: [7, 8, 9, 10, 11, 12, 13].map((n) => n + i),
}));

const REVIEW_STATUSES = ["Accepted", "Rejected", "Draft product", "Missing"] as const;

function buildManifests(): Manifest[] {
  const rows: Manifest[] = [];
  for (let i = 1; i <= 42; i++) {
    const status = MANIFEST_STATUSES[i % MANIFEST_STATUSES.length];
    const staff = STAFF[i % STAFF.length];
    const code = `BATCH-${1000 + i}`;
    const itemCount = i <= 8 ? 4 + (i % 5) : i % 4 === 0 ? 3 : 0;
    const items = Array.from({ length: itemCount }, (_, j) => {
      const reviewStatus = REVIEW_STATUSES[(i + j) % REVIEW_STATUSES.length];
      return {
        id: `mi-${i}-${j}`,
        title: `Sample Item ${String.fromCharCode(65 + (j % 26))} · Batch ${i}`,
        sku: `${code}-${String(j).padStart(2, "0")}`,
        reviewStatus,
        rejectReason: reviewStatus === "Rejected" ? REJECT_REASONS[(i + j) % REJECT_REASONS.length] : undefined,
      };
    });
    rows.push({
      id: `m${i}`,
      code,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      createdBy: staff.name,
      createdAt: daysAgo(i % 21),
      updatedAt: hoursAgo(i % 48),
      status,
      productCount: items.length || 8 + ((i * 7) % 90),
      items,
      notes:
        i === 1
          ? [
              {
                id: "n1",
                user: staff.handle,
                body: "Driver picked up — barcode missed on one tote. Status updated.",
                at: hoursAgo(6),
              },
            ]
          : i % 7 === 0
            ? [
                {
                  id: `n-${i}`,
                  user: staff.handle,
                  body: "Partial tote — Infinity AI skipped low-confidence photos.",
                  at: hoursAgo(i),
                },
              ]
            : [],
      events:
        i === 1
          ? [
              { id: "e1", user: staff.handle, action: "created this item batch", at: hoursAgo(8) },
              {
                id: "e2",
                user: staff.handle,
                action: "marked this item batch as ready for pickup",
                at: hoursAgo(7.5),
              },
              {
                id: "e3",
                user: staff.handle,
                action: "marked this item batch as received",
                at: hoursAgo(6.5),
              },
              {
                id: "e4",
                user: staff.handle,
                action: "began processing this item batch",
                at: hoursAgo(6),
              },
              {
                id: "e5",
                user: "infinity-ai",
                action: "Infinity AI suggested Auto-Draft for 2 accepted items",
                at: hoursAgo(5),
              },
            ]
          : [
              {
                id: `e-${i}-a`,
                user: staff.handle,
                action: "created this item batch",
                at: daysAgo(i % 21),
              },
              ...(status !== "Created"
                ? [
                    {
                      id: `e-${i}-b`,
                      user: i % 3 === 0 ? "infinity-ai" : staff.handle,
                      action:
                        i % 3 === 0
                          ? "Infinity AI queued accepted items for Auto-Draft"
                          : "updated batch status",
                      at: hoursAgo(i % 40),
                    },
                  ]
                : []),
            ],
    });
  }
  return rows;
}

export const manifests = buildManifests();

function buildProducts(): Product[] {
  const rows: Product[] = [];
  for (let i = 1; i <= 120; i++) {
    const status = PRODUCT_STATUSES[i % 10 === 0 ? 2 : i % 3 === 0 ? 1 : 0];
    const staff = STAFF[i % STAFF.length];
    const listedOn: ListingChannel[] =
      status === "Active"
        ? i % 3 === 0
          ? ["ShopGoodwill", "eBay"]
          : i % 2 === 0
            ? ["ShopGoodwill"]
            : ["eBay"]
        : [];
    rows.push({
      id: `p${i}`,
      title: `Sample Product ${i} — ${CATEGORIES[i % CATEGORIES.length]}`,
      sku: `SKU-${(1000 + i).toString()}`,
      status,
      location: i % 5 === 0 ? "—" : `Bin ${String.fromCharCode(65 + (i % 6))}-${10 + (i % 20)}`,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      createdBy: staff.handle,
      createdAt: daysAgo(i % 21),
      category: CATEGORIES[i % CATEGORIES.length],
      price: Math.round((12 + (i % 40) * 3.25 + (i % 7)) * 100) / 100,
      imageColor: COLORS[i % COLORS.length],
      listedOn,
      description: `Demo catalog item ${i} for ${ORG_NAME}. Condition notes and accessories go here.`,
    });
  }
  return rows;
}

export const products = buildProducts();

function buildListings(): Listing[] {
  const rows: Listing[] = [];
  let id = 1;
  for (const product of products.filter((p) => p.status === "Active")) {
    for (const channel of product.listedOn) {
      const status =
        id % 17 === 0
          ? ("Additional QA Required" as const)
          : LISTING_STATUSES[id % LISTING_STATUSES.length];
      rows.push({
        id: `l${id}`,
        productId: product.id,
        channel,
        title: product.title,
        sku: product.sku,
        status,
        price: Math.round(product.price * (channel === "eBay" ? 1.05 : 1) * 100) / 100,
        strategy: product.category ?? "General",
        tags: id % 4 === 0 ? ["Auto-List"] : id % 5 === 0 ? ["Auto-Draft"] : ["Demo"],
        postedBy: product.createdBy,
        postedAt: product.createdAt,
        location: product.location,
        supplier: product.supplier,
        externalId: channel === "eBay" ? `EB-${20000 + id}` : `EXT-${30000 + id}`,
        imageColor: product.imageColor,
      });
      id += 1;
    }
  }
  return rows;
}

export const listings = buildListings();

function buildOrders(): Order[] {
  const rows: Order[] = [];
  const pay = ["Paid", "Paid", "Paid", "Pending", "Refunded"] as const;
  const fulfill = ["Unfulfilled", "Unfulfilled", "Partial", "Fulfilled", "Fulfilled"] as const;
  for (let i = 1; i <= 80; i++) {
    rows.push({
      id: `o${i}`,
      orderNumber: `ORD-${2000 + i}`,
      channel: i % 2 === 0 ? "eBay" : "ShopGoodwill",
      customer: `Customer ${i}`,
      total: Math.round((18 + (i % 25) * 7.4) * 100) / 100,
      paymentStatus: pay[i % pay.length],
      fulfillmentStatus: fulfill[i % fulfill.length],
      itemCount: 1 + (i % 4),
      createdAt: hoursAgo(i * 2),
    });
  }
  return rows;
}

export const orders = buildOrders();

function buildShipments(): Shipment[] {
  const rows: Shipment[] = [];
  const carriers = ["USPS", "UPS", "FedEx"];
  const statuses = ["Label created", "In transit", "Delivered"] as const;
  const fulfilled = orders.filter((o) => o.fulfillmentStatus !== "Unfulfilled");
  fulfilled.slice(0, 48).forEach((o, i) => {
    rows.push({
      id: `s${i + 1}`,
      orderNumber: o.orderNumber,
      carrier: carriers[i % carriers.length],
      trackingNumber: `9400${String(1100000000000000 + i * 1117).slice(0, 16)}`,
      cost: Math.round((6.5 + (i % 9) * 1.35) * 100) / 100,
      shippedAt: daysAgo(i % 10),
      status: statuses[i % statuses.length],
    });
  });
  return rows;
}

export const shipments = buildShipments();

export const notifications = [
  {
    id: "n1",
    title: `${dashboardStats.failedListings} eBay listings need attention`,
    body: `${dashboardStats.failedAccount} — Infinity AI flagged title/category mismatches.`,
    at: hoursAgo(1),
    unread: true,
    href: "/listings/ebay?status=Additional%20QA%20Required",
  },
  {
    id: "n2",
    title: `${infinityStats.pendingAiReview} Auto-Drafts waiting review`,
    body: "Infinity AI prepared drafts from accepted intake items.",
    at: hoursAgo(2),
    unread: true,
    href: "/products/auto-draft",
  },
  {
    id: "n3",
    title: `${dashboardStats.unfulfilledOrders} unfulfilled orders`,
    body: "Orders waiting for shipment labels.",
    at: hoursAgo(3),
    unread: true,
    href: "/orders?fulfillment=Unfulfilled",
  },
  {
    id: "n4",
    title: `Item batch ${manifests[0].code} partially processed`,
    body: `1 item still missing from ${manifests[0].supplier}.`,
    at: hoursAgo(5),
    unread: false,
    href: "/manifests/m1",
  },
  {
    id: "n5",
    title: "Auto-List queue ready",
    body: `${infinityStats.autoListedToday} items Auto-Listed today across channels.`,
    at: hoursAgo(7),
    unread: false,
    href: "/products/auto-list",
  },
  {
    id: "n6",
    title: "Printer offline",
    body: "Label printer on Station 2 is not responding.",
    at: daysAgo(1),
    unread: false,
    href: "/settings/printer",
  },
];

export const listerProductivity = STAFF.map((s, i) => ({
  user: s.handle,
  posted: 110 - i * 9,
  listed: 102 - i * 8,
  sold: 18 - i,
  revenue: Math.round((2400 - i * 210) * 100) / 100,
  autoDrafted: 40 - i * 3,
  autoListed: 28 - i * 2,
}));

export const operationalActivity = Array.from({ length: 30 }).map((_, i) => {
  const day = new Date(now - (29 - i) * 86400000);
  return {
    date: day.toISOString().slice(0, 10),
    intake: 140 + i * 4 + (i % 4) * 12,
    photographed: 110 + i * 3,
    posted: 95 + i * 3,
    autoDrafted: 70 + i * 2,
    autoListed: 55 + i * 2,
    sold: 48 + i * 2,
    shipped: 44 + i * 2,
  };
});

export const manifestReportRows = SUPPLIERS.map((supplier, i) => ({
  supplier,
  manifests: 420 - i * 28,
  items: 9800 - i * 620,
  processed: 94 - (i % 8),
  recovery: 120 - i * 2,
}));

export const eventLogRows = [
  {
    at: minsAgo(2),
    user: "infinity-ai",
    entity: "Auto-Draft",
    action: "Generated draft title + category for SKU-1012",
  },
  {
    at: minsAgo(8),
    user: "jdoe",
    entity: "Product SKU-1001",
    action: "Uploaded 7 images",
  },
  {
    at: minsAgo(15),
    user: "infinity-ai",
    entity: "Auto-List",
    action: "Queued SKU-1008 to ShopGoodwill",
  },
  {
    at: minsAgo(20),
    user: "ajones",
    entity: "Listing EB-20021",
    action: "Listed on eBay",
  },
  {
    at: minsAgo(35),
    user: "infinity-ai",
    entity: "Auto-Draft",
    action: "Price suggestion $34.50 (confidence 93%) for SKU-1044",
  },
  {
    at: hoursAgo(1),
    user: "system",
    entity: "eBay sync",
    action: `${dashboardStats.failedListings} listings failed validation`,
  },
  {
    at: hoursAgo(1.5),
    user: "infinity-ai",
    entity: "Auto-List",
    action: "Published 12 items to ShopGoodwill in batch",
  },
  {
    at: hoursAgo(2),
    user: "bwilson",
    entity: "Order ORD-2001",
    action: "Marked paid",
  },
  {
    at: hoursAgo(3),
    user: "jsmith",
    entity: `Item batch ${manifests[0].code}`,
    action: "Marked item missing",
  },
  {
    at: hoursAgo(4),
    user: "infinity-ai",
    entity: "Infinity AI",
    action: "Category match confidence 96% on 18 new drafts",
  },
  {
    at: hoursAgo(5),
    user: "slee",
    entity: "Product SKU-1088",
    action: "Approved Auto-Draft and sent to Auto-List",
  },
  {
    at: hoursAgo(6),
    user: "mbrown",
    entity: "Shipment s3",
    action: "Created USPS label",
  },
  {
    at: hoursAgo(7),
    user: "infinity-ai",
    entity: "Auto-Draft",
    action: "Skipped 3 items below confidence threshold",
  },
  {
    at: hoursAgo(8),
    user: "ctaylor",
    entity: "Order ORD-2014",
    action: "Partial fulfill — 1 of 3 lines shipped",
  },
  {
    at: hoursAgo(10),
    user: "pmorgan",
    entity: "Listing EXT-30012",
    action: "Relisted expired ShopGoodwill auction",
  },
  {
    at: daysAgo(1),
    user: "infinity-ai",
    entity: "Auto-List",
    action: "Channel routing: electronics → eBay preferred",
  },
];

export const top50Sales = Array.from({ length: 50 }).map((_, i) => ({
  rank: i + 1,
  title: `Sample Product ${((i * 3) % 120) + 1} sale`,
  channel: i % 2 === 0 ? "ShopGoodwill" : "eBay",
  soldPrice: Math.round((260 - i * 3.8) * 100) / 100,
  cost: 40 + (i % 6) * 7,
  soldAt: daysAgo(i % 18),
  autoListed: i % 3 !== 0,
}));

export const refundRows = Array.from({ length: 18 }).map((_, i) => ({
  orderNumber: `ORD-${2004 + i * 3}`,
  customer: `Customer ${4 + i}`,
  channel: i % 2 === 0 ? "ShopGoodwill" : "eBay",
  total: Math.round((22 + i * 6.5) * 100) / 100,
  reason: ["Buyer remorse", "Item not as described", "Damaged in transit", "Wrong item"][i % 4],
  status: "Refunded",
  refundedAt: daysAgo(i % 12),
}));

export const supplierReportRows = weeklySupplierSales.map((s, i) => ({
  ...s,
  itemsListed: 520 - i * 35,
  itemsSold: 120 - i * 9,
  avgDaysToSell: 5 + i,
}));

export const autoDraftQueue = products
  .filter((p) => p.status === "Draft")
  .slice(0, 28)
  .map((p, i) => ({
    id: `ad-${p.id}`,
    productId: p.id,
    title: p.title,
    sku: p.sku,
    category: p.category,
    suggestedPrice: p.price,
    confidence: 88 + (i % 10),
    source: i % 2 === 0 ? "Intake accept" : "Photo complete",
    generatedAt: hoursAgo(i + 1),
  }));

export const autoListQueue = products
  .filter((p) => p.status === "Active" && p.listedOn.length < 2)
  .slice(0, 24)
  .map((p, i) => ({
    id: `al-${p.id}`,
    productId: p.id,
    title: p.title,
    sku: p.sku,
    channel: (i % 2 === 0 ? "ShopGoodwill" : "eBay") as ListingChannel,
    price: p.price,
    readiness: 90 + (i % 8),
    generatedAt: hoursAgo(i + 2),
  }));

export function getManifest(id: string) {
  return manifests.find((m) => m.id === id || m.code === id);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id || p.sku === id);
}

export function getListing(id: string) {
  return listings.find((l) => l.id === id);
}
