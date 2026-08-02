/** Period-aware org metrics for the Test Goodwill home screen. */

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

export type HomePeriod = "day" | "week" | "month";

export const HOME_PERIODS: { id: HomePeriod; label: string; hint: string }[] = [
  { id: "day", label: "Day", hint: "Today" },
  { id: "week", label: "Week", hint: "Last 7 days" },
  { id: "month", label: "Month", hint: "Month to date" },
];

export type HomeSaleRow = {
  rank: number;
  title: string;
  channel: "ShopGoodwill" | "eBay";
  soldPrice: number;
  soldAt: string;
};

export type HomeListerRow = {
  rank: number;
  name: string;
  handle: string;
  listed: number;
  revenue: number;
};

export type HomePhotographerRow = {
  rank: number;
  name: string;
  handle: string;
  photos: number;
  items: number;
};

export type HomePeriodMetrics = {
  periodLabel: string;
  rangeLabel: string;
  topLineRevenue: number;
  asp: number;
  sellThrough: number;
  paidOrders: number;
  unitsSold: number;
  salesSpark: number[];
  topSales: HomeSaleRow[];
  topListers: HomeListerRow[];
  topPhotographers: HomePhotographerRow[];
};

const STAFF = [
  { name: "John Doe", handle: "jdoe" },
  { name: "Jane Smith", handle: "jsmith" },
  { name: "Alice Jones", handle: "ajones" },
  { name: "Bob Wilson", handle: "bwilson" },
  { name: "Mike Brown", handle: "mbrown" },
  { name: "Sara Lee", handle: "slee" },
  { name: "Chris Taylor", handle: "ctaylor" },
  { name: "Pat Morgan", handle: "pmorgan" },
] as const;

const SALE_TITLES = [
  "Vintage Levi's 501 Jeans — 34×32",
  "Sony WH-1000XM4 Wireless Headphones",
  "KitchenAid Stand Mixer — Empire Red",
  "Nintendo Switch OLED Console Bundle",
  "Patagonia Better Sweater Fleece M",
  "Dyson V11 Cordless Vacuum",
  "Apple iPad Air 5th Gen 64GB",
  "Coach Signature Crossbody Bag",
  "Bose SoundLink Revolve+ Speaker",
  "Yeti Rambler 30oz Tumbler Set",
  "Canon EOS Rebel T7 DSLR Kit",
  "North Face ThermoBall Jacket L",
  "Roomba i7 Robot Vacuum",
  "Samsung 55\" 4K Smart TV",
  "Herman Miller Aeron Chair Size B",
  "Lululemon Align High-Rise Leggings",
  "DeWalt 20V Drill/Driver Combo",
  "Instant Pot Duo Plus 9-in-1",
  "AirPods Pro 2nd Generation",
  "Ray-Ban Wayfarer Sunglasses",
  "Cuisinart Food Processor 14-Cup",
  "Garmin Forerunner 255 Watch",
  "Pottery Barn Throw Blanket Set",
  "Xbox Series X 1TB Console",
  "Columbia Powder Lite Jacket XL",
  "Vitamix Explorian Blender E310",
  "Kate Spade Leather Wallet",
  "Peloton Bike+ Accessories Lot",
  "JBL Charge 5 Bluetooth Speaker",
  "UGG Classic Short Boots Size 8",
  "Nespresso Vertuo Next Machine",
  "Timberland 6\" Premium Boots 10",
  "GoPro HERO11 Black Bundle",
  "Crate & Barrel Serving Bowl Set",
  "Fitbit Charge 6 Fitness Tracker",
  "Le Creuset Dutch Oven 5.5qt",
  "Beats Studio Pro Headphones",
  "Carhartt Duck Jacket Brown L",
  "Philips Hue Starter Kit",
  "Michael Kors Jet Set Tote",
  "Anker PowerCore 26800 Power Bank",
  "Starbucks Reserve Pour-Over Kit",
  "Under Armour HOVR Running Shoes",
  "Roku Ultra Streaming Player",
  "Pottery Lot — Mid-Century Vases",
  "LEGO Architecture Skyline Bundle",
  "Hydro Flask 40oz Wide Mouth",
  "Fossil Grant Chronograph Watch",
  "All-Clad Stainless Skillet 12\"",
  "Vintage Band Tee Lot (Mixed)",
];

function buildTopSales(
  seed: number,
  priceBase: number,
  priceStep: number,
  soldAt: (i: number) => string
): HomeSaleRow[] {
  return Array.from({ length: 50 }, (_, i) => {
    const titleIdx = (i * 7 + seed * 3) % SALE_TITLES.length;
    const channel: "ShopGoodwill" | "eBay" =
      (i + seed) % 3 === 0 ? "eBay" : "ShopGoodwill";
    return {
      rank: i + 1,
      title: SALE_TITLES[titleIdx],
      channel,
      soldPrice: Math.round((priceBase - i * priceStep + ((i + seed) % 5) * 2.4) * 100) / 100,
      soldAt: soldAt(i),
    };
  });
}

function buildListers(
  order: number[],
  listedBase: number,
  listedStep: number,
  revenueBase: number,
  revenueStep: number
): HomeListerRow[] {
  return order.map((staffIdx, rank) => {
    const s = STAFF[staffIdx];
    return {
      rank: rank + 1,
      name: s.name,
      handle: s.handle,
      listed: Math.max(4, listedBase - rank * listedStep + (staffIdx % 3)),
      revenue: Math.round((revenueBase - rank * revenueStep + staffIdx * 37) * 100) / 100,
    };
  });
}

function buildPhotographers(
  order: number[],
  photosBase: number,
  photosStep: number,
  itemsBase: number,
  itemsStep: number
): HomePhotographerRow[] {
  return order.map((staffIdx, rank) => {
    const s = STAFF[staffIdx];
    return {
      rank: rank + 1,
      name: s.name,
      handle: s.handle,
      photos: Math.max(12, photosBase - rank * photosStep + (staffIdx % 4) * 3),
      items: Math.max(3, itemsBase - rank * itemsStep + (staffIdx % 3)),
    };
  });
}

export const homeMetricsByPeriod: Record<HomePeriod, HomePeriodMetrics> = {
  day: {
    periodLabel: "Today",
    rangeLabel: "Sales so far today",
    topLineRevenue: 48210.55,
    asp: 94.16,
    sellThrough: 18.4,
    paidOrders: 512,
    unitsSold: 512,
    salesSpark: [22, 24, 21, 29, 34, 31, 38, 36, 42, 44, 48, 51],
    topSales: buildTopSales(1, 268, 3.9, (i) => hoursAgo(1 + (i % 14))),
    topListers: buildListers([0, 2, 1, 5, 3, 4, 6, 7], 96, 9, 9200, 780),
    topPhotographers: buildPhotographers([1, 0, 4, 2, 6, 3, 5, 7], 420, 38, 86, 7),
  },
  week: {
    periodLabel: "Last 7 days",
    rangeLabel: "Trailing seven days",
    topLineRevenue: 287640.2,
    asp: 88.42,
    sellThrough: 24.7,
    paidOrders: 3252,
    unitsSold: 3252,
    salesSpark: [38, 41, 36, 44, 48, 46, 52, 49, 55, 58, 61, 64],
    topSales: buildTopSales(4, 312, 4.2, (i) => daysAgo(i % 7)),
    topListers: buildListers([2, 0, 5, 1, 6, 4, 3, 7], 512, 42, 48500, 4100),
    topPhotographers: buildPhotographers([0, 4, 1, 6, 2, 5, 7, 3], 2140, 165, 430, 32),
  },
  month: {
    periodLabel: "Month to date",
    rangeLabel: "1st through today",
    topLineRevenue: 1128450.75,
    asp: 91.08,
    sellThrough: 31.2,
    paidOrders: 12390,
    unitsSold: 12390,
    salesSpark: [42, 45, 48, 46, 52, 55, 58, 54, 61, 64, 68, 72],
    topSales: buildTopSales(9, 348, 4.6, (i) => daysAgo(i % 28)),
    topListers: buildListers([5, 2, 0, 6, 1, 3, 4, 7], 1840, 145, 168000, 14200),
    topPhotographers: buildPhotographers([4, 0, 6, 1, 2, 7, 5, 3], 8120, 520, 1640, 110),
  },
};

export const DEFAULT_HOME_PERIOD: HomePeriod = "day";
