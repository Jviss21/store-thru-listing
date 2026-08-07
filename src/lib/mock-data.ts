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
import { productPhotoUrls } from "./photos";
import { STRATEGY_NAMES } from "./listing-strategies";

/** Single front-end customer for this demo. */
export const ORG_NAME = "Test Goodwill";
export const ORG_SLUG = "test-goodwill";
export const BRAND = {
  product: "hammoq",
  /** Official iOS app display name (App Store id 6746443451). */
  ai: "InfinityAI",
  autoList: "Auto-List",
  /** Official iOS retail triage app (App Store id 6460302479). */
  retail: "Hammoq Retail",
};

/** InfinityAI — photos → AI listing → IMS Auto-List (App Store). */
export const INFINITY_AI_APP_STORE_URL =
  "https://apps.apple.com/us/app/infinityai/id6746443451";

/** Hammoq Retail — store intake triage retail vs ecom (App Store). */
export const HAMMOQ_RETAIL_APP_STORE_URL =
  "https://apps.apple.com/us/app/hammoq-retail/id6460302479";

/**
 * Desktop / web demo surface for Infinity AI → Auto-List queue in IMS.
 * Mobile CTAs should prefer {@link INFINITY_AI_APP_STORE_URL}.
 */
export const INFINITY_AI_UPLOAD_HREF = "/infinity-ai";

/** True when the UA looks like a phone/tablet (client-only). */
export function isMobileClient(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Primary InfinityAI CTA target:
 * App Store on mobile; in-app Infinity AI / Auto-List queue on desktop.
 */
export function resolveInfinityAiUploadHref(): string {
  return isMobileClient() ? INFINITY_AI_APP_STORE_URL : INFINITY_AI_UPLOAD_HREF;
}

/** Retail / ecom triage tags stored on donor products until iOS bridge lands. */
export type RetailTriage = "retail" | "ecom" | "undecided";

export function retailTriageTag(triage: RetailTriage): string {
  return `triage:${triage}`;
}

/** Strategy names — definitions live in `listing-strategies.ts`. */
export const STRATEGIES = STRATEGY_NAMES;

export const CARRIERS = ["FedEx", "UPS", "USPS", "OnTrac"];

export const BOX_PADDINGS = ["None", "1 inch", "2 inches", "3 inches", "4 inches"];
export const SHIPPING_BOXES = ["Select", "Small Flat Rate", "Medium Box", "Large Box", "Poly Mailer", "Custom"];
export const LISTING_DURATIONS = ["1 Day", "3 Days", "5 Days", "7 Days", "10 Days", "GTC"];
export const START_TIMES = ["Immediately", "Schedule for later"];
export const SHIPPING_PROFILES = [
  "Shipping Default",
  "FedEx Free Shipping",
  "Calculated - FedEx Ground",
  "Flat $9.99",
  "Local pickup only",
];
export const RETURNS_PROFILES = [
  "Return Default",
  "No returns accepted",
  "30-day returns - Buyer pays return shipping",
  "30-day returns - Seller pays return shipping",
];
export const PAYMENT_PROFILES = [
  "Auction Items",
  "ebay Managed Payments",
  "Managed payments (eBay / marketplace default)",
];

export const CONDITIONS = [
  "Used - Good",
  "Used - Very Good",
  "Used - Acceptable",
  "New with tags",
  "For parts or not working",
];

export const CATEGORY_PATHS: Record<string, string> = {
  "Home Goods": "Home & Garden > Household Supplies",
  Electronics: "Electronics > Consumer Electronics",
  Sports: "Sporting Goods > Outdoor Recreation",
  "Books & Media": "Books & Magazines > Books",
  Apparel: "Clothing, Shoes & Accessories",
  "General Merchandise": "Everything Else > General Merchandise",
  "Toys & Games": "Toys & Hobbies > Games",
  "Jewelry & Accessories": "Jewelry & Watches > Fashion Jewelry",
  "Tools & Hardware": "Business & Industrial > Hand Tools",
  Collectibles: "Collectibles > Decorative Collectibles",
  Travel: "Travel/Luggage > Backpacks",
  "Handbags & Bags": "Clothing & Accessories > Handbags",
};

const SAMPLE_TITLES = [
  "Adidas Men Athletic Shoes Size 10 Blue",
  "Harley Davidson Helmet Bag Leather",
  "Cuisinart Stainless Cookware Set 10pc",
  "Vintage Pyrex Mixing Bowl Nesting Set",
  "Nintendo Switch OLED Console Dock Only",
  "Levi's 501 Jeans Mens 34x32 Dark Wash",
  "KitchenAid Stand Mixer Bowl Stainless",
  "Sony WH-1000XM4 Wireless Headphones",
  "Patagonia Fleece Jacket Mens Large",
  "Lego City Fire Station Incomplete Set",
  "Coach Crossbody Purse Brown Leather",
  "DeWalt 20V Drill Driver Kit Bare Tool",
  "Yankee Candle Large Jar Fresh Cotton",
  "Apple AirPods Pro Gen 2 Case Only",
  "North Face Backpack Black 28L Daypack",
];

export const CURRENT_USER = {
  name: "John Doe",
  email: "john.doe@testgoodwill.example",
  handle: "jdoe",
  role: "Lister",
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
  "Travel",
  "Handbags & Bags",
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
const daysFromNow = (d: number) => new Date(now + d * 86400000).toISOString();
const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();

const COLORS = [
  "#0d1b34",
  "#f0b429",
  "#e87a1a",
  "#c94a2a",
  "#c9a032",
  "#3d5a80",
  "#162a4a",
  "#5a6b82",
  "#d4920a",
  "#a63b22",
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
                action: "Infinity AI suggested Auto-List for 2 accepted items",
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
                          ? "Infinity AI queued accepted items for Auto-List"
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
    const category = CATEGORIES[i % CATEGORIES.length];
    const strategy = STRATEGIES[i % STRATEGIES.length];
    const listedOn: ListingChannel[] =
      status === "Active"
        ? i % 3 === 0
          ? ["ShopGoodwill", "eBay"]
          : i % 2 === 0
            ? ["ShopGoodwill"]
            : ["eBay"]
        : [];
    const titleBase = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
    const imsProductId = String(41516000 + i);
    const brand = ["Adidas", "Harley-Davidson", "Cuisinart", "Sony", "Levi's", "Generic"][i % 6];
    const condition = CONDITIONS[i % CONDITIONS.length];
    rows.push({
      id: `p${i}`,
      title: `${titleBase} · Lot ${i}`,
      subtitle: i % 3 === 0 ? `${brand} · ${condition}` : undefined,
      sku: `TGW${(610000 + i).toString(36).toUpperCase()}`,
      status,
      location:
        i % 7 === 0
          ? `Cart - ${10 + (i % 20)}`
          : `${String.fromCharCode(65 + (i % 8))} - ${1 + (i % 12)} - ${1 + (i % 5)}`,
      supplier: SUPPLIERS[i % SUPPLIERS.length],
      createdBy: staff.handle,
      createdAt: daysAgo(i % 21),
      category,
      categoryPath: CATEGORY_PATHS[category] ?? category,
      price: Math.round((12 + (i % 40) * 3.25 + (i % 7)) * 100) / 100,
      imageColor: COLORS[i % COLORS.length],
      imageUrls: productPhotoUrls(`tgw-p${i}`, 3 + (i % 3)),
      listedOn,
      description: `Pre-owned ${titleBase} from ${ORG_NAME}. Inspected by ${staff.handle}. Photos show actual item. Smoke-free facility.`,
      privateDescription: `TGW${(610000 + i).toString(36).toUpperCase()}-${String(i % 5).padStart(2, "0")}`,
      carrier: CARRIERS[i % CARRIERS.length],
      condition,
      brand,
      mpn: i % 4 === 0 ? `MPN-${8000 + i}` : undefined,
      upc: i % 5 === 0 ? `0${88000000000 + i}` : undefined,
      weightLbs: Math.round((0.5 + (i % 15) * 0.35) * 100) / 100,
      lengthIn: 8 + (i % 10),
      widthIn: 6 + (i % 8),
      heightIn: 2 + (i % 6),
      strategy,
      tags:
        i % 4 === 0
          ? ["HMQ-Auto-List"]
          : i % 3 === 0
            ? ["Demo", "Priority"]
            : ["Demo"],
      imsProductId,
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
      const itemSpecifics: Record<string, string> = {
        Brand: product.brand ?? "Unbranded",
        Condition: product.condition ?? "Used - Good",
        Department: product.category,
        Color: ["Black", "Blue", "Brown", "Silver", "Multi"][id % 5],
      };
      if (product.mpn) itemSpecifics.MPN = product.mpn;
      if (product.upc) itemSpecifics.UPC = product.upc;
      rows.push({
        id: `l${id}`,
        productId: product.id,
        channel,
        title: product.title,
        subtitle: product.subtitle,
        sku: product.sku,
        status,
        price: Math.round(product.price * (channel === "eBay" ? 1.05 : 1) * 100) / 100,
        quantity: 1,
        strategy: product.strategy ?? "General",
        tags: product.tags ?? ["Demo"],
        postedBy: product.createdBy,
        postedAt: hoursAgo(id % 72),
        productCreatedAt: product.createdAt,
        location: product.location,
        supplier: product.supplier,
        carrier: product.carrier ?? "FedEx",
        categoryPath: product.categoryPath,
        externalId:
          channel === "eBay"
            ? `EB-${20000 + id}`
            : id % 3 === 0
              ? `SGW-${400000 + id}`
              : "—",
        imsProductId: product.imsProductId ?? String(41516000 + id),
        privateDescription: product.privateDescription ?? product.sku,
        condition: product.condition ?? "Used - Good",
        brand: product.brand ?? "Unbranded",
        mpn: product.mpn,
        upc: product.upc,
        weightLbs: product.weightLbs ?? 1,
        lengthIn: product.lengthIn ?? 10,
        widthIn: product.widthIn ?? 8,
        heightIn: product.heightIn ?? 4,
        description: product.description ?? "",
        imageColor: product.imageColor,
        imageUrls: product.imageUrls,
        itemSpecifics,
        returnsPolicy: "30-day returns · Buyer pays return shipping",
        paymentPolicy: "Managed payments (eBay / marketplace default)",
        shippingPolicy: `${product.carrier ?? "FedEx"} Ground · Calculated`,
        itemLocation: "Test Goodwill · Anonymized Demo Facility, USA",
      });
      id += 1;
    }
  }
  return rows;
}

export const listings = buildListings();

const ORDER_SHIPPING_METHODS = [
  "Standard",
  "Expedited",
  "Priority Mail",
  "FedEx Ground",
  "Flat $9.99",
  "Local pickup",
] as const;

const BUYER_HANDLES = [
  "thriftfinder88",
  "mountainbuyer",
  "co_reseller",
  "dealhunter_jg",
  "vintagevault",
  "sgw_shopper",
  "ebay_poweruser",
  "closetclearout",
  "localpickup_only",
  "jewelry_jane",
];

function buildChannelOrderId(channel: ListingChannel, i: number) {
  if (channel === "eBay") {
    const a = String(3 + (i % 7)).padStart(2, "0");
    const b = String(14000 + ((i * 37) % 9000)).padStart(5, "0");
    const c = String(10000 + ((i * 91) % 90000)).padStart(5, "0");
    return `${a}-${b}-${c}`;
  }
  return `SGW-${400000 + i * 17}`;
}

function buildOrders(): Order[] {
  const rows: Order[] = [];
  const pay = [
    "Paid",
    "Paid",
    "Paid",
    "Paid",
    "Pending",
    "Refunded",
    "Partially Paid",
    "Partially Refunded",
  ] as const;
  const fulfill = [
    "Unfulfilled",
    "Unfulfilled",
    "Unfulfilled",
    "Partial",
    "Fulfilled",
    "Fulfilled",
  ] as const;
  const pickPack = [
    "Not started",
    "Not started",
    "Being pulled",
    "Picked",
    "Packed",
    "Not found",
  ] as const;

  for (let i = 1; i <= 140; i++) {
    const channel: ListingChannel = i % 2 === 0 ? "eBay" : "ShopGoodwill";
    const itemCount = 1 + (i % 5);
    const orderType = itemCount > 1 ? "Multi" : "Single";
    const fulfillmentStatus = fulfill[i % fulfill.length];
    let pickPackStatus = pickPack[i % pickPack.length];
    if (i % 23 === 0) pickPackStatus = "Not found";
    if (fulfillmentStatus === "Fulfilled" && pickPackStatus === "Not started") {
      pickPackStatus = "Packed";
    }
    if (fulfillmentStatus === "Unfulfilled" && i % 11 === 0) {
      pickPackStatus = "Being pulled";
    }
    if (fulfillmentStatus === "Unfulfilled" && orderType === "Multi" && i % 9 === 0) {
      pickPackStatus = "Picked";
    }

    const createdAt = hoursAgo(i * 1.7 + (i % 5));
    const paymentStatus = pay[i % pay.length];
    const paidAt =
      paymentStatus === "Pending" ? null : hoursAgo(i * 1.5 + (i % 3));

    let shipBy: string;
    if (i % 13 === 0) shipBy = daysAgo(1 + (i % 4));
    else if (i % 7 === 0) shipBy = daysFromNow(i % 2);
    else shipBy = daysFromNow(3 + (i % 10));

    const isNotFound = pickPackStatus === "Not found";
    const open = fulfillmentStatus !== "Fulfilled";
    const shipByMs = new Date(shipBy).getTime();
    const isOverdue = open && shipByMs < now;
    const isUrgent = open && !isOverdue && shipByMs - now <= 2 * 86400000;

    const titleBase = SAMPLE_TITLES[i % SAMPLE_TITLES.length];
    const sku = `TGW${(610000 + i).toString(36).toUpperCase()}`;
    const trackingNumber =
      fulfillmentStatus === "Fulfilled" || fulfillmentStatus === "Partial"
        ? `9400${String(1100000000000000 + i * 2213).slice(0, 16)}`
        : null;

    rows.push({
      id: `o${i}`,
      orderNumber: `ORD-${2000 + i}`,
      channel,
      channelOrderId: buildChannelOrderId(channel, i),
      customer: BUYER_HANDLES[i % BUYER_HANDLES.length],
      total: Math.round((18 + (i % 25) * 7.4 + itemCount * 3.2) * 100) / 100,
      paymentStatus,
      fulfillmentStatus,
      itemCount,
      createdAt,
      paidAt,
      shipBy,
      title: `${titleBase} · Lot ${i}`,
      sku,
      itemId: String(23248000 + i),
      unitId: `U-${90000 + i}`,
      trackingNumber,
      pickPackStatus,
      shippingMethod: ORDER_SHIPPING_METHODS[i % ORDER_SHIPPING_METHODS.length],
      orderType,
      category: CATEGORIES[i % CATEGORIES.length],
      location:
        i % 7 === 0
          ? `Cart - ${10 + (i % 20)}`
          : `${String.fromCharCode(65 + (i % 8))} - ${1 + (i % 12)} - ${1 + (i % 5)}`,
      destination: i % 11 === 0 ? "International" : "Domestic",
      isOverdue,
      isUrgent,
      isNotFound,
    });
  }
  return rows;
}

export const orders = buildOrders();

function hexChunk(seed: number, len: number) {
  let n = Math.abs(seed * 2654435761) >>> 0;
  let out = "";
  while (out.length < len) {
    n = (n * 1664525 + 1013904223) >>> 0;
    out += n.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

function channelOrderIdFor(order: Order, i: number) {
  return order.channelOrderId || buildChannelOrderId(order.channel, i);
}

function buildShipments(): Shipment[] {
  const rows: Shipment[] = [];
  const carriers = ["FedEx", "UPS", "USPS", "OnTrac"];
  const statuses = ["Label created", "In transit", "Delivered"] as const;
  const pool = orders.filter((o) => o.fulfillmentStatus !== "Unfulfilled");
  // Dense mock set so search / filter / sort feel real.
  const target = 120;
  for (let i = 0; i < target; i++) {
    const o = pool[i % pool.length]!;
    const carrier = carriers[i % carriers.length]!;
    const staff = STAFF[i % STAFF.length]!;
    const packer = STAFF[(i + 3) % STAFF.length]!;
    const labelCost = Math.round((5.2 + (i % 17) * 1.45 + (i % 5) * 0.37) * 100) / 100;
    const fees = Math.round((0.04 + (i % 9) * 0.01) * 100) / 100;
    const insured = i % 7 === 0 ? Math.round((15 + (i % 5) * 10) * 100) / 100 : null;
    const shipmentNumber = String(382975300000 + i * 137 + (i % 11) * 19);
    const tracking =
      carrier === "USPS"
        ? `9400${String(1100000000000000 + i * 1117).slice(0, 16)}`
        : carrier === "UPS"
          ? `1Z999AA1${String(1000000000 + i * 7919).slice(0, 10)}`
          : carrier === "OnTrac"
            ? `C${String(10000000000 + i * 3331).slice(0, 11)}`
            : shipmentNumber;
    rows.push({
      id: `s${i + 1}`,
      shipmentNumber,
      orderId: o.id,
      orderNumber: o.orderNumber,
      channelOrderId: channelOrderIdFor(o, i),
      channel: o.channel,
      carrier,
      trackingNumber: tracking,
      easyPostId: `shp_${hexChunk(i + 42, 32)}`,
      cost: labelCost,
      fees,
      insurance: insured,
      createdBy: staff.handle,
      packedBy: packer.handle,
      shippedAt: daysAgo(i % 28),
      status: statuses[i % statuses.length]!,
    });
  }
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
    title: `${infinityStats.pendingAiReview} items ready for Auto-List`,
    body: "Infinity AI prepared channel packets from accepted intake items.",
    at: hoursAgo(2),
    unread: true,
    href: "/products/auto-list",
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
  autoListed: 28 - i * 2,
}));

export const operationalActivity = Array.from({ length: 30 }).map((_, i) => {
  const day = new Date(now - (29 - i) * 86400000);
  return {
    date: day.toISOString().slice(0, 10),
    intake: 140 + i * 4 + (i % 4) * 12,
    photographed: 110 + i * 3,
    posted: 95 + i * 3,
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
    entity: "Product SKU-1012",
    action: "Generated title + category suggestion",
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
    entity: "Product SKU-1044",
    action: "Price suggestion $34.50 (confidence 93%)",
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
    action: "Sent ready product to Auto-List",
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
    entity: "Infinity AI",
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

export const top50Sales = Array.from({ length: 50 }).map((_, i) => {
  const product = products[((i * 3) % products.length)];
  return {
    rank: i + 1,
    title: product?.title ?? `Sample Product ${((i * 3) % 120) + 1} sale`,
    sku: product?.sku ?? `TGW${1000 + i}`,
    channel: i % 2 === 0 ? "ShopGoodwill" : "eBay",
    soldPrice: Math.round((260 - i * 3.8) * 100) / 100,
    cost: 40 + (i % 6) * 7,
    soldAt: daysAgo(i % 18),
    autoListed: i % 3 !== 0,
    supplier: product?.supplier ?? SUPPLIERS[i % SUPPLIERS.length],
  };
});

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

export function getOrder(id: string) {
  const key = id.toLowerCase();
  return orders.find(
    (o) =>
      o.id === id ||
      o.orderNumber === id ||
      o.orderNumber.toLowerCase() === key ||
      o.channelOrderId === id ||
      o.channelOrderId.toLowerCase() === key ||
      o.itemId === id ||
      o.sku.toLowerCase() === key
  );
}

export function getShipment(id: string) {
  return shipments.find(
    (s) =>
      s.id === id ||
      s.shipmentNumber === id ||
      s.easyPostId === id ||
      s.trackingNumber === id
  );
}
