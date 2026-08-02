/** Period-aware org metrics for the Test Goodwill home screen.
 *
 * Formulas (stable across Day / Week / Month):
 *   ASP            = topLineRevenue / unitsSold  ≈ $46.00
 *   Sell through   = unitsSold / unitsListed     = 60.0%
 *   Top line       = ASP × unitsSold
 *   paidOrders     = unitsSold  (1 unit per paid order in this model)
 */

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

/** Thrift-appropriate collectibles + clothing for Top 50 (not high-ticket electronics). */
const SALE_TITLES = [
  "Vintage 1989 Topps Baseball Card Lot (Star Mix)",
  "Levi's 501 Jeans — 34×32 Dark Wash",
  "Hummel Porcelain Figurine — Girl with Basket",
  "Patagonia Synchilla Fleece Pullover M",
  "Pokémon TCG Base Set Commons/Uncommons Lot",
  "Carhartt Duck Jacket Brown — Size L",
  "Vintage Band Tee — Grateful Dead Tour Reprint",
  "Pyrex Nesting Bowl Set — Primary Colors",
  "Lululemon Align High-Rise Leggings 6",
  "Cast Iron Skillet — Lodge 10.25\" Pre-Seasoned",
  "North Face Fleece Zip — Women's M",
  "Beanie Baby Lot (Retired, Tagged ×8)",
  "Coach Canvas Tote — Signature C",
  "Vintage Hawaiian Shirt — Reyn Spooner L",
  "Funko Pop Lot — Marvel Wave (×6)",
  "Columbia Powder Lite Puffer — XL",
  "Sterling Silver Charm Bracelet + Charms",
  "Eddie Bauer Flannel Shirt — Men's L",
  "Comic Book Lot — Marvel 80s/90s (×12)",
  "UGG Classic Short Boots — Size 8",
  "Vintage Denim Jacket — Levi's Type III M",
  "Fire King Jadeite Mixing Bowl",
  "Nike Dunk Low Retro — Men's 10",
  "Quilted Vera Bradley Crossbody Bag",
  "Hot Wheels Redline-Era Style Lot (×10)",
  "Gap Wool Peacoat — Women's M",
  "Vintage Silk Scarf Lot — Designer Mix (×4)",
  "LL Bean Bean Boots — Size 9",
  "Porcelain Tea Set — Floral Transferware",
  "Adidas Samba OG Sneakers — Men's 9.5",
  "Ralph Lauren Polo Shirt Lot (×3)",
  "Vintage Vinyl LP Lot — Classic Rock (×8)",
  "J.Crew Wool Blend Coat — Women's S",
  "Macrame Plant Hanger + Mid-Century Planter",
  "Carhartt Beanie + Work Gloves Bundle",
  "Action Figure Lot — Star Wars Kenner-Style (×5)",
  "Madewell Straight Jeans — 28×30",
  "Vintage Brooch Lot — Costume Jewelry (×7)",
  "Patagonia Better Sweater — Men's M",
  "Enamelware Pitcher + Basin Set",
  "Champion Reverse Weave Hoodie — L",
  "Pottery Lot — Mid-Century Studio Vases (×3)",
  "Birkenstock Arizona Sandals — Size 40",
  "Vintage Band Tee Lot — Soft Cotton Mix (×4)",
  "Thermos Vintage Picnic Jug — Red Plaid",
  "Uniqlo + J Crew Sweater Bundle (×3)",
  "Postcard Collection — Travel Ephemera (×40)",
  "Old Navy Jean Jacket — Women's M",
  "Candle Lot — Yankee / Bath Body Works (×6)",
  "Flannel Shirt Lot — Men's L/XL (×4)",
];

/** Top-50 price curve (highest sold): collectible outliers → mid → stronger clothing.
 *  Avg ≈ $58; overall org ASP stays $46 once cheaper $8–$30 bulk sales are included.
 */
const TOP50_PRICES = [
  148.0, 132.0, 118.0, 108.0, 98.0, 92.0, 86.0, 80.0, 76.0, 72.0, 68.0, 65.0, 62.0, 60.0, 58.0, 56.0,
  54.0, 53.0, 52.0, 51.0, 50.0, 49.0, 48.0, 47.0, 46.0, 45.0, 44.0, 43.0, 42.0, 41.0, 40.0, 39.5,
  39.0, 38.5, 38.0, 37.5, 37.0, 36.5, 36.0, 35.5, 35.0, 34.5, 34.0, 33.5, 33.0, 32.5, 32.0, 31.5,
  31.0, 30.5,
];

function buildTopSales(
  seed: number,
  priceScale: number,
  soldAt: (i: number) => string
): HomeSaleRow[] {
  return Array.from({ length: 50 }, (_, i) => {
    const titleIdx = (i * 7 + seed * 3) % SALE_TITLES.length;
    const channel: "ShopGoodwill" | "eBay" =
      (i + seed) % 3 === 0 ? "eBay" : "ShopGoodwill";
    const jitter = ((i + seed) % 5) * 0.4 - 0.8;
    const soldPrice =
      Math.round((TOP50_PRICES[i]! * priceScale + jitter) * 100) / 100;
    return {
      rank: i + 1,
      title: SALE_TITLES[titleIdx]!,
      channel,
      soldPrice,
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
    const s = STAFF[staffIdx]!;
    return {
      rank: rank + 1,
      name: s.name,
      handle: s.handle,
      listed: Math.max(4, listedBase - rank * listedStep + (staffIdx % 3)),
      revenue: Math.round((revenueBase - rank * revenueStep + staffIdx * 12) * 100) / 100,
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
    const s = STAFF[staffIdx]!;
    return {
      rank: rank + 1,
      name: s.name,
      handle: s.handle,
      photos: Math.max(12, photosBase - rank * photosStep + (staffIdx % 4) * 3),
      items: Math.max(3, itemsBase - rank * itemsStep + (staffIdx % 3)),
    };
  });
}

/** Shared ASP / sell-through targets. */
const ASP = 46.0;
const SELL_THROUGH = 60.0;

/**
 * Period volumes — unitsSold divisible by 3 so listed = sold / 0.6 is an integer.
 * Day ≈ today; Week ≈ 7× day; Month ≈ 30× day.
 */
const DAY_UNITS = 480; // listed 800
const WEEK_UNITS = 3360; // listed 5600
const MONTH_UNITS = 14400; // listed 24000

export const homeMetricsByPeriod: Record<HomePeriod, HomePeriodMetrics> = {
  day: {
    periodLabel: "Today",
    rangeLabel: "Sales so far today",
    topLineRevenue: DAY_UNITS * ASP, // 22,080.00
    asp: ASP,
    sellThrough: SELL_THROUGH,
    paidOrders: DAY_UNITS,
    unitsSold: DAY_UNITS,
    // Hourly unit volume through the day (sums ≈ 480)
    salesSpark: [28, 32, 30, 36, 42, 38, 44, 46, 48, 52, 42, 42],
    topSales: buildTopSales(1, 1, (i) => hoursAgo(1 + (i % 14))),
    // Top 8 ≈ full org list volume (800) and most of top-line revenue
    topListers: buildListers([0, 2, 1, 5, 3, 4, 6, 7], 128, 12, 3200, 280),
    topPhotographers: buildPhotographers([1, 0, 4, 2, 6, 3, 5, 7], 360, 32, 78, 6),
  },
  week: {
    periodLabel: "Last 7 days",
    rangeLabel: "Trailing seven days",
    topLineRevenue: WEEK_UNITS * ASP, // 154,560.00
    asp: ASP,
    sellThrough: SELL_THROUGH,
    paidOrders: WEEK_UNITS,
    unitsSold: WEEK_UNITS,
    // Daily-ish spark scaled to week volume
    salesSpark: [42, 46, 40, 48, 52, 50, 56, 54, 58, 62, 64, 68],
    topSales: buildTopSales(4, 1.05, (i) => daysAgo(i % 7)),
    topListers: buildListers([2, 0, 5, 1, 6, 4, 3, 7], 860, 72, 22400, 1950),
    topPhotographers: buildPhotographers([0, 4, 1, 6, 2, 5, 7, 3], 1840, 140, 380, 28),
  },
  month: {
    periodLabel: "Month to date",
    rangeLabel: "1st through today",
    topLineRevenue: MONTH_UNITS * ASP, // 662,400.00
    asp: ASP,
    sellThrough: SELL_THROUGH,
    paidOrders: MONTH_UNITS,
    unitsSold: MONTH_UNITS,
    salesSpark: [48, 52, 50, 56, 58, 54, 62, 60, 66, 70, 72, 76],
    topSales: buildTopSales(9, 1.08, (i) => daysAgo(i % 28)),
    topListers: buildListers([5, 2, 0, 6, 1, 3, 4, 7], 3600, 280, 96000, 8200),
    topPhotographers: buildPhotographers([4, 0, 6, 1, 2, 7, 5, 3], 7200, 460, 1480, 100),
  },
};

export const DEFAULT_HOME_PERIOD: HomePeriod = "day";
