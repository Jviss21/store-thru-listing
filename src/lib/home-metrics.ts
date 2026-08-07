/** Period-aware org metrics for the Test Goodwill home screen.
 *
 * Formulas (stable across Day / Hour / Week / Month / Custom):
 *   ASP            = topLineRevenue / unitsSold   (falls out of the mix)
 *   Sell through   = unitsSold / unitsListed      (natural thrift band)
 *   Top line       = ASP × unitsSold
 *   paidOrders     = unitsSold  (1 unit per paid order in this model)
 *
 * Catalog mix: jewelry, collectibles, clothing, shoes, home goods,
 * plus authenticated designer / luxury pieces as higher-ASP outliers.
 * No hard-locked ASP or sell-through targets.
 *
 * Day  = today's daily summary (KPIs + top sales).
 * Hour = dedicated 8am–8pm hourly breakdown (chart + hour table) for today.
 */

import {
  daysInRange,
  formatDisplayDateLong,
  formatInclusiveRangeLabel,
  inclusiveDayCount,
  monthToDateRange,
  todayYmd,
  trailingDaysRange,
} from "@/lib/report-dates";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

export type HomePeriod = "day" | "hour" | "week" | "month" | "custom";
export type HomePresetPeriod = Exclude<HomePeriod, "custom">;

export type HomeCustomRange = { start: string; end: string };

export const HOME_PERIODS: { id: HomePeriod; label: string; hint: string }[] = [
  { id: "day", label: "Day", hint: "Today summary" },
  { id: "hour", label: "Hour", hint: "Today by hour" },
  { id: "week", label: "Week", hint: "Last 7 days" },
  { id: "month", label: "Month", hint: "Month to date" },
  { id: "custom", label: "Custom", hint: "Pick dates" },
];
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default custom window: trailing 14 days inclusive through today. */
export function defaultCustomRange(nowDate = new Date()): HomeCustomRange {
  const end = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  return { start: ymdLocal(start), end: ymdLocal(end) };
}

export function normalizeCustomRange(start: string, end: string): HomeCustomRange {
  if (!start && !end) return defaultCustomRange();
  if (!start) return { start: end, end };
  if (!end) return { start, end: start };
  return start <= end ? { start, end } : { start: end, end: start };
}
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

/** One business-hour bucket for Hour mode (units + revenue). */
export type HomeHourRow = {
  hour: number;
  label: string;
  units: number;
  revenue: number;
};

/** Spark / sales chart bucket size. Hour (and short Custom) use hours. */
export type SparkGranularity = "hour" | "day";

export type HomePeriodMetrics = {
  periodLabel: string;
  rangeLabel: string;
  topLineRevenue: number;
  asp: number;
  sellThrough: number;
  paidOrders: number;
  unitsSold: number;
  /** Unit volume per spark bucket (hour or day). */
  salesSpark: number[];
  /** Axis labels aligned 1:1 with salesSpark (e.g. "9am", "Mon 8"). */
  sparkLabels: string[];
  sparkGranularity: SparkGranularity;
  /** Populated in Hour mode: per-hour units + revenue (8am–8pm). */
  hourRows: HomeHourRow[];
  topSales: HomeSaleRow[];
  topListers: HomeListerRow[];
  topPhotographers: HomePhotographerRow[];
};
/** Format 0–23 as 12am / 9am / 12pm / 3pm. */
export function formatHourLabel(hour: number): string {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

/** Business-day hours shown on the Day chart (8am–8pm inclusive). */
export const HOME_BUSINESS_HOURS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const;

export function businessHourLabels(): string[] {
  return HOME_BUSINESS_HOURS.map((h) => formatHourLabel(h));
}

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

/** Top-50 sold catalog: thrift/resale mix + authenticated luxury outliers.
 *  Prices reflect typical ShopGoodwill / eBay thrift ranges ($8 tees → authenticated bags/watches).
 */
const TOP50_CATALOG: { title: string; price: number }[] = [
  { title: "Authenticated Rolex Datejust 36 — Steel Jubilee", price: 2845.0 },
  { title: "Authenticated Louis Vuitton Speedy 30 Monogram", price: 512.0 },
  { title: "Authenticated Omega Seamaster Professional 300M", price: 1280.0 },
  { title: "Authenticated Gucci GG Marmont Matelassé Mini", price: 395.0 },
  { title: "Authenticated Chanel Caviar Zip Wallet — Black", price: 342.0 },
  { title: "Authenticated Prada Saffiano Crossbody — Black", price: 298.0 },
  { title: "Authenticated Cartier Must de Cartier Tank Watch", price: 520.0 },
  { title: "Authenticated Jordan 1 Retro High OG — Men's 9", price: 248.0 },
  { title: "Authenticated Hermès Silk Carré Scarf — Vintage Print", price: 226.0 },
  { title: "Authenticated Tiffany & Co. Sterling Heart Tag Necklace", price: 178.0 },
  { title: "Authenticated Coach Tabby Shoulder Bag 26", price: 118.0 },
  { title: "Authenticated Nike Dunk Low Retro Panda — Men's 10", price: 134.0 },
  { title: "14K Yellow Gold Rope Chain — 18\" Fine", price: 286.0 },
  { title: "Vintage 1989 Topps Baseball Card Lot (Star Mix)", price: 96.0 },
  { title: "Pokémon TCG Base Set Commons/Uncommons Lot", price: 88.0 },
  { title: "Sterling Silver Charm Bracelet + Charms", price: 74.0 },
  { title: "Patagonia Synchilla Fleece Pullover M", price: 68.0 },
  { title: "Levi's 501 Jeans — 34×32 Dark Wash", price: 42.0 },
  { title: "Hummel Porcelain Figurine — Girl with Basket", price: 64.0 },
  { title: "Carhartt Duck Jacket Brown — Size L", price: 58.0 },
  { title: "Vintage Band Tee — Grateful Dead Tour Reprint", price: 36.0 },
  { title: "Pyrex Nesting Bowl Set — Primary Colors", price: 48.0 },
  { title: "Lululemon Align High-Rise Leggings 6", price: 52.0 },
  { title: "Cast Iron Skillet — Lodge 10.25\" Pre-Seasoned", price: 28.0 },
  { title: "North Face Fleece Zip — Women's M", price: 44.0 },
  { title: "Beanie Baby Lot (Retired, Tagged ×8)", price: 38.0 },
  { title: "Vintage Hawaiian Shirt — Reyn Spooner L", price: 34.0 },
  { title: "Funko Pop Lot — Marvel Wave (×6)", price: 46.0 },
  { title: "Columbia Powder Lite Puffer — XL", price: 40.0 },
  { title: "Eddie Bauer Flannel Shirt — Men's L", price: 22.0 },
  { title: "Comic Book Lot — Marvel 80s/90s (×12)", price: 55.0 },
  { title: "UGG Classic Short Boots — Size 8", price: 62.0 },
  { title: "Vintage Denim Jacket — Levi's Type III M", price: 54.0 },
  { title: "Fire King Jadeite Mixing Bowl", price: 72.0 },
  { title: "Quilted Vera Bradley Crossbody Bag", price: 24.0 },
  { title: "Hot Wheels Redline-Era Style Lot (×10)", price: 41.0 },
  { title: "Gap Wool Peacoat — Women's M", price: 39.0 },
  { title: "Vintage Silk Scarf Lot — Designer Mix (×4)", price: 31.0 },
  { title: "LL Bean Bean Boots — Size 9", price: 47.0 },
  { title: "Porcelain Tea Set — Floral Transferware", price: 33.0 },
  { title: "Adidas Samba OG Sneakers — Men's 9.5", price: 56.0 },
  { title: "Ralph Lauren Polo Shirt Lot (×3)", price: 29.0 },
  { title: "Vintage Vinyl LP Lot — Classic Rock (×8)", price: 45.0 },
  { title: "J.Crew Wool Blend Coat — Women's S", price: 49.0 },
  { title: "Action Figure Lot — Star Wars Kenner-Style (×5)", price: 67.0 },
  { title: "Madewell Straight Jeans — 28×30", price: 32.0 },
  { title: "Vintage Brooch Lot — Costume Jewelry (×7)", price: 26.0 },
  { title: "Patagonia Better Sweater — Men's M", price: 51.0 },
  { title: "Birkenstock Arizona Sandals — Size 40", price: 43.0 },
  { title: "Champion Reverse Weave Hoodie — L", price: 35.0 },
];

function buildTopSales(
  seed: number,
  priceScale: number,
  soldAt: (i: number) => string
): HomeSaleRow[] {
  // Rotate catalog order slightly by period so Day/Week/Month don't look identical,
  // but keep authenticated high-ticket pieces near the top of each list.
  const offset = (seed * 3) % 8;
  const rotated = [
    ...TOP50_CATALOG.slice(offset),
    ...TOP50_CATALOG.slice(0, offset),
  ];
  // Re-sort by price so Top 50 stays "highest sold" after rotation + scale.
  const ranked = rotated
    .map((item, i) => {
      const jitter = ((i + seed) % 7) * 0.35 - 1.05;
      const soldPrice =
        Math.round((item.price * priceScale + jitter) * 100) / 100;
      return { ...item, soldPrice, origIdx: i };
    })
    .sort((a, b) => b.soldPrice - a.soldPrice);

  return ranked.map((item, i) => {
    const channel: "ShopGoodwill" | "eBay" =
      (i + seed) % 3 === 0 ? "eBay" : "ShopGoodwill";
    return {
      rank: i + 1,
      title: item.title,
      channel,
      soldPrice: item.soldPrice,
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

/**
 * Period volumes — organic thrift ops (sell-through typically mid-30s–low-40s%).
 * ASP varies by mix (authenticated outliers pull Day/Month slightly higher).
 *
 *   Day:   396 sold / 940 listed  → 42.1%  ·  rev $20,512.80  → ASP $51.80
 *   Week: 2755 sold / 7850 listed → 35.1%  ·  rev $132,791.00 → ASP $48.20
 *   Month: 11890 sold / 30500 listed → 39.0% · rev $643,249.00 → ASP $54.10
 */
const DAY = { unitsSold: 396, unitsListed: 940, revenue: 20512.8 } as const;
const WEEK = { unitsSold: 2755, unitsListed: 7850, revenue: 132791.0 } as const;
const MONTH = { unitsSold: 11890, unitsListed: 30500, revenue: 643249.0 } as const;

function aspOf(revenue: number, unitsSold: number) {
  return Math.round((revenue / unitsSold) * 100) / 100;
}

function sellThroughOf(unitsSold: number, unitsListed: number) {
  return Math.round((unitsSold / unitsListed) * 1000) / 10;
}

/** Distribute `total` across weight slots; result sums exactly to total. */
function distributeByWeights(total: number, weights: number[], seed = 0): number[] {
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w, i) => {
    const jitter = (((i + seed) % 5) - 2) * 0.35;
    return Math.max(0, (total * w) / wSum + jitter);
  });
  const rounded = raw.map((v) => Math.round(v));
  let diff = total - rounded.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0 && rounded.length > 0) {
    const idx = (i + seed) % rounded.length;
    if (diff > 0) {
      rounded[idx]! += 1;
      diff -= 1;
    } else if (rounded[idx]! > 0) {
      rounded[idx]! -= 1;
      diff += 1;
    }
    i += 1;
    if (i > rounded.length * 4) break;
  }
  return rounded;
}

/**
 * Hourly unit volume for a single calendar day (business hours 8am–8pm).
 * Shape: ramp morning → midday plateau → evening auction peak.
 */
export function sparkForBusinessHours(unitsSold: number, seed = 1): number[] {
  // Relative weights for 8am … 8pm
  const weights = [18, 24, 28, 32, 34, 30, 28, 32, 36, 40, 38, 30, 26];
  return distributeByWeights(unitsSold, weights, seed);
}

/** Per-hour units + revenue for Hour mode table (sums match day totals). */
export function buildHourRows(
  unitsSold: number,
  revenue: number,
  seed = 1
): HomeHourRow[] {
  const units = sparkForBusinessHours(unitsSold, seed);
  const revParts = distributeByWeights(
    Math.round(revenue * 100),
    units.map((u) => Math.max(u, 0.5)),
    seed + 3
  ).map((cents) => cents / 100);
  // Fix floating pennies so sum === revenue
  let revDiff =
    Math.round(revenue * 100) - revParts.reduce((a, b) => a + Math.round(b * 100), 0);
  let i = 0;
  while (revDiff !== 0 && revParts.length > 0) {
    const idx = (i + seed) % revParts.length;
    const step = revDiff > 0 ? 0.01 : -0.01;
    if (revDiff < 0 && revParts[idx]! + step < 0) {
      i += 1;
      if (i > revParts.length * 4) break;
      continue;
    }
    revParts[idx] = Math.round((revParts[idx]! + step) * 100) / 100;
    revDiff -= revDiff > 0 ? 1 : -1;
    i += 1;
  }
  return HOME_BUSINESS_HOURS.map((hour, idx) => ({
    hour,
    label: formatHourLabel(hour),
    units: units[idx]!,
    revenue: revParts[idx]!,
  }));
}

/** Hourly spark spanning multiple calendar days (Custom ≤ 2 days). */
function sparkForHourlyRange(dayCount: number, unitsSold: number, seed: number): {
  salesSpark: number[];
  sparkLabels: string[];
} {
  const hours = HOME_BUSINESS_HOURS;
  if (dayCount <= 1) {
    return {
      salesSpark: sparkForBusinessHours(unitsSold, seed),
      sparkLabels: businessHourLabels(),
    };
  }
  // Two days: label as "Mon 9am" style using day index
  const labels: string[] = [];
  const weights: number[] = [];
  for (let d = 0; d < dayCount; d++) {
    const dayTag = d === 0 ? "D1" : "D2";
    for (let hi = 0; hi < hours.length; hi++) {
      const h = hours[hi]!;
      labels.push(`${dayTag} ${formatHourLabel(h)}`);
      // Slightly lower overnight-adjacent ends; day 2 mirrors day 1
      const base = [18, 24, 28, 32, 34, 30, 28, 32, 36, 40, 38, 30, 26][hi]!;
      weights.push(base * (d === 0 ? 1 : 0.95));
    }
  }
  return {
    salesSpark: distributeByWeights(unitsSold, weights, seed),
    sparkLabels: labels,
  };
}

function shortDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
}

function sparkForDailyRange(days: string[], unitsSold: number, seed: number): {
  salesSpark: number[];
  sparkLabels: string[];
} {
  const n = Math.max(1, days.length);
  const weights = days.map((_, i) => 10 + ((i + seed) % 5) + Math.round(Math.sin((i + seed) * 0.8) * 3));
  return {
    salesSpark: distributeByWeights(unitsSold, weights, seed),
    sparkLabels: days.map(shortDayLabel),
  };
}

/** Custom ranges of 1–2 inclusive days use hourly buckets; longer ranges stay daily. */
export function customUsesHourly(range: HomeCustomRange): boolean {
  return inclusiveDayCount(range.start, range.end) <= 2;
}

export const homeMetricsByPeriod: Record<HomePresetPeriod, HomePeriodMetrics> = {
  day: {
    // Labels overwritten in getHomeMetrics with calendar day (weekday + date).
    periodLabel: "Today",
    rangeLabel: "Sales so far today · jewelry, collectibles, apparel & authenticated luxury",
    topLineRevenue: DAY.revenue,
    asp: aspOf(DAY.revenue, DAY.unitsSold),
    sellThrough: sellThroughOf(DAY.unitsSold, DAY.unitsListed),
    paidOrders: DAY.unitsSold,
    unitsSold: DAY.unitsSold,
    // Compact spark for header; detailed hourly view lives on Hour tab.
    salesSpark: sparkForBusinessHours(DAY.unitsSold, 1),
    sparkLabels: businessHourLabels(),
    sparkGranularity: "hour",
    hourRows: [],
    topSales: buildTopSales(1, 1, (i) => hoursAgo(1 + (i % 14))),
    topListers: buildListers([0, 2, 1, 5, 3, 4, 6, 7], 148, 14, 2980, 265),
    topPhotographers: buildPhotographers([1, 0, 4, 2, 6, 3, 5, 7], 360, 32, 78, 6),
  },
  hour: {
    periodLabel: "By hour",
    rangeLabel: "Hourly sales · 8am–8pm · jewelry, collectibles, apparel & authenticated luxury",
    topLineRevenue: DAY.revenue,
    asp: aspOf(DAY.revenue, DAY.unitsSold),
    sellThrough: sellThroughOf(DAY.unitsSold, DAY.unitsListed),
    paidOrders: DAY.unitsSold,
    unitsSold: DAY.unitsSold,
    salesSpark: sparkForBusinessHours(DAY.unitsSold, 1),
    sparkLabels: businessHourLabels(),
    sparkGranularity: "hour",
    hourRows: buildHourRows(DAY.unitsSold, DAY.revenue, 1),
    topSales: buildTopSales(1, 1, (i) => hoursAgo(1 + (i % 14))),
    topListers: buildListers([0, 2, 1, 5, 3, 4, 6, 7], 148, 14, 2980, 265),
    topPhotographers: buildPhotographers([1, 0, 4, 2, 6, 3, 5, 7], 360, 32, 78, 6),
  },
  week: {
    periodLabel: "Last 7 days",
    rangeLabel: "Trailing seven days · thrift mix + authenticated handbags & sneakers",
    topLineRevenue: WEEK.revenue,
    asp: aspOf(WEEK.revenue, WEEK.unitsSold),
    sellThrough: sellThroughOf(WEEK.unitsSold, WEEK.unitsListed),
    paidOrders: WEEK.unitsSold,
    unitsSold: WEEK.unitsSold,
    // Filled in getHomeMetrics with real trailing-7 day labels
    salesSpark: [],
    sparkLabels: [],
    sparkGranularity: "day",
    hourRows: [],
    topSales: buildTopSales(4, 1.03, (i) => daysAgo(i % 7)),
    topListers: buildListers([2, 0, 5, 1, 6, 4, 3, 7], 980, 78, 19200, 1680),
    topPhotographers: buildPhotographers([0, 4, 1, 6, 2, 5, 7, 3], 1840, 140, 380, 28),
  },
  month: {
    periodLabel: "Month to date",
    rangeLabel: "1st through today · apparel, collectibles & authenticated designer goods",
    topLineRevenue: MONTH.revenue,
    asp: aspOf(MONTH.revenue, MONTH.unitsSold),
    sellThrough: sellThroughOf(MONTH.unitsSold, MONTH.unitsListed),
    paidOrders: MONTH.unitsSold,
    unitsSold: MONTH.unitsSold,
    salesSpark: [],
    sparkLabels: [],
    sparkGranularity: "day",
    hourRows: [],
    topSales: buildTopSales(9, 1.06, (i) => daysAgo(i % 28)),
    topListers: buildListers([5, 2, 0, 6, 1, 3, 4, 7], 4100, 310, 88500, 7400),
    topPhotographers: buildPhotographers([4, 0, 6, 1, 2, 7, 5, 3], 7200, 460, 1480, 100),
  },
};

function labelsForPreset(period: HomePresetPeriod, now = new Date()) {
  if (period === "day") {
    const day = todayYmd(now);
    const long = formatDisplayDateLong(day);
    return {
      periodLabel: long,
      rangeLabel: `Sales so far on ${long} · jewelry, collectibles, apparel & authenticated luxury`,
    };
  }
  if (period === "hour") {
    const day = todayYmd(now);
    const long = formatDisplayDateLong(day);
    return {
      periodLabel: `By hour · ${long}`,
      rangeLabel: `Hourly breakdown · 8am–8pm on ${long} · thrift mix + authenticated luxury`,
    };
  }
  if (period === "week") {
    const range = trailingDaysRange(7, now);
    const label = formatInclusiveRangeLabel(range.start, range.end, { long: true });
    return {
      periodLabel: "Last 7 days",
      rangeLabel: `${label} · thrift mix + authenticated handbags & sneakers`,
    };
  }
  const range = monthToDateRange(now);
  const label = formatInclusiveRangeLabel(range.start, range.end, { long: true });
  return {
    periodLabel: "Month to date",
    rangeLabel: `${label} · apparel, collectibles & authenticated designer goods`,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Scale volumes between Day / Week / Month anchors by inclusive day count. */
function volumeForDays(n: number) {
  const days = Math.max(1, n);
  if (days === 1) return { ...DAY };

  if (days <= 7) {
    const t = (days - 1) / 6;
    const dailySold = lerp(DAY.unitsSold, WEEK.unitsSold / 7, t);
    const dailyListed = lerp(DAY.unitsListed, WEEK.unitsListed / 7, t);
    const dailyRev = lerp(DAY.revenue, WEEK.revenue / 7, t);
    return {
      unitsSold: Math.round(dailySold * days),
      unitsListed: Math.round(dailyListed * days),
      revenue: Math.round(dailyRev * days * 100) / 100,
    };
  }

  const t = Math.min(1, (days - 7) / 23);
  const dailySold = lerp(WEEK.unitsSold / 7, MONTH.unitsSold / 30, t);
  const dailyListed = lerp(WEEK.unitsListed / 7, MONTH.unitsListed / 30, t);
  const dailyRev = lerp(WEEK.revenue / 7, MONTH.revenue / 30, t);
  return {
    unitsSold: Math.round(dailySold * days),
    unitsListed: Math.round(dailyListed * days),
    revenue: Math.round(dailyRev * days * 100) / 100,
  };
}

function formatCustomPeriodLabel(range: HomeCustomRange) {
  return formatInclusiveRangeLabel(range.start, range.end, { long: true });
}

function buildCustomMetrics(range: HomeCustomRange): HomePeriodMetrics {
  const days = daysInRange(range.start, range.end);
  const n = Math.max(1, days.length);
  const vol = volumeForDays(n);
  const seed = (n * 5 + range.start.length + range.end.charCodeAt(range.end.length - 1)) % 11;
  const priceScale = n <= 1 ? 1 : n <= 7 ? 1.02 : 1.05;
  const staffScale = Math.max(1, n / 7);
  const label = formatCustomPeriodLabel(range);
  const dayWord = n === 1 ? "1 day" : `${n} days`;
  const hourly = n <= 2;
  const spark = hourly
    ? sparkForHourlyRange(n, vol.unitsSold, seed)
    : sparkForDailyRange(days, vol.unitsSold, seed);

  return {
    periodLabel: label,
    rangeLabel: `Custom · ${label} · ${dayWord} inclusive · thrift mix + authenticated luxury`,
    topLineRevenue: vol.revenue,
    asp: aspOf(vol.revenue, vol.unitsSold),
    sellThrough: sellThroughOf(vol.unitsSold, vol.unitsListed),
    paidOrders: vol.unitsSold,
    unitsSold: vol.unitsSold,
    salesSpark: spark.salesSpark,
    sparkLabels: spark.sparkLabels,
    sparkGranularity: hourly ? "hour" : "day",
    hourRows: hourly && n === 1 ? buildHourRows(vol.unitsSold, vol.revenue, seed) : [],
    topSales: buildTopSales(seed || 2, priceScale, (i) => {
      const day = days[i % days.length]!;
      const hour = HOME_BUSINESS_HOURS[i % HOME_BUSINESS_HOURS.length]!;
      return `${day}T${String(hour).padStart(2, "0")}:00:00.000Z`;
    }),
    topListers: buildListers(
      [2, 0, 5, 1, 6, 4, 3, 7],
      Math.round(140 * staffScale),
      Math.round(12 * staffScale),
      Math.round(2700 * staffScale),
      Math.round(240 * staffScale)
    ),
    topPhotographers: buildPhotographers(
      [0, 4, 1, 6, 2, 5, 7, 3],
      Math.round(340 * staffScale),
      Math.round(28 * staffScale),
      Math.round(72 * staffScale),
      Math.round(5 * staffScale)
    ),
  };
}

function attachPresetSpark(
  period: HomePresetPeriod,
  base: HomePeriodMetrics,
  now = new Date()
): HomePeriodMetrics {
  if (period === "day") {
    return {
      ...base,
      salesSpark: sparkForBusinessHours(base.unitsSold, 1),
      sparkLabels: businessHourLabels(),
      sparkGranularity: "hour",
      hourRows: [],
    };
  }
  if (period === "hour") {
    const spark = sparkForBusinessHours(base.unitsSold, 1);
    return {
      ...base,
      salesSpark: spark,
      sparkLabels: businessHourLabels(),
      sparkGranularity: "hour",
      hourRows: buildHourRows(base.unitsSold, base.topLineRevenue, 1),
    };
  }
  if (period === "week") {
    const range = trailingDaysRange(7, now);
    const days = daysInRange(range.start, range.end);
    const spark = sparkForDailyRange(days, base.unitsSold, 4);
    return { ...base, ...spark, sparkGranularity: "day", hourRows: [] };
  }
  const range = monthToDateRange(now);
  const days = daysInRange(range.start, range.end);
  const spark = sparkForDailyRange(days, base.unitsSold, 9);
  return { ...base, ...spark, sparkGranularity: "day", hourRows: [] };
}

/** Resolve metrics for a preset period or a custom from–to range. */
export function getHomeMetrics(
  period: HomePeriod,
  customRange?: HomeCustomRange
): HomePeriodMetrics {
  if (period !== "custom") {
    const base = homeMetricsByPeriod[period];
    return attachPresetSpark(period, { ...base, ...labelsForPreset(period) });
  }
  const range = normalizeCustomRange(
    customRange?.start ?? defaultCustomRange().start,
    customRange?.end ?? defaultCustomRange().end
  );
  return buildCustomMetrics(range);
}

export const DEFAULT_HOME_PERIOD: HomePeriod = "day";
