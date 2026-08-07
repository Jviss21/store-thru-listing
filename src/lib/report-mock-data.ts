import { SUPPLIERS, CATEGORIES, products, BRAND } from "@/lib/mock-data";
import { daysInRange } from "@/lib/report-dates";

const FIRST = [
  "Alex", "Blair", "Casey", "Dana", "Ellis", "Finn", "Gray", "Harper", "Indie", "Jordan",
  "Kai", "Logan", "Morgan", "Noah", "Oakley", "Parker", "Quinn", "Riley", "Sam", "Taylor",
  "Uma", "Vince", "Wes", "Xander", "Yael", "Zara", "Avery", "Blake", "Cameron", "Drew",
];
const LAST = [
  "Nguyen", "Patel", "Garcia", "Kim", "Johnson", "Smith", "Lee", "Brown", "Davis", "Wilson",
  "Martinez", "Anderson", "Thomas", "Jackson", "White", "Harris", "Clark", "Lewis", "Young", "Allen",
  "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Green", "Adams", "Baker", "Nelson",
  "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards",
];

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export type ReportStaff = {
  id: string;
  handle: string;
  name: string;
  active: boolean;
};

/** 120 staff for productivity scale demos */
export const REPORT_STAFF: ReportStaff[] = Array.from({ length: 120 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = LAST[i % LAST.length];
  const handle = `${first[0].toLowerCase()}${last.toLowerCase()}${i > 29 ? i : ""}`;
  return {
    id: `staff-${i + 1}`,
    handle,
    name: `${first} ${last}`,
    active: i % 11 !== 0,
  };
});

export const PRODUCTIVITY_METRICS = [
  "accepted",
  "rejected",
  "photographed",
  "posted",
  "shelved",
  "purged",
  "picked",
  "packed",
  "shipped",
] as const;

export type ProductivityMetric = (typeof PRODUCTIVITY_METRICS)[number];

export type UserProductivityRow = {
  user: string;
  active: boolean;
} & Record<ProductivityMetric, number>;

export function buildUserProductivity(start: string, end: string): UserProductivityRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  return REPORT_STAFF.map((s, i) => {
    const base = seeded(i + span * 3);
    const scale = s.active ? 1 : 0.08;
    const row = {
      user: s.handle,
      active: s.active,
      accepted: Math.round((8 + base * 40) * span * scale),
      rejected: Math.round((1 + seeded(i + 2) * 12) * span * scale),
      photographed: Math.round((6 + seeded(i + 3) * 35) * span * scale),
      posted: Math.round((5 + seeded(i + 4) * 32) * span * scale),
      shelved: Math.round((2 + seeded(i + 5) * 10) * span * scale),
      purged: Math.round((seeded(i + 6) * 6) * span * scale),
      picked: Math.round((3 + seeded(i + 7) * 18) * span * scale),
      packed: Math.round((3 + seeded(i + 8) * 16) * span * scale),
      shipped: Math.round((2 + seeded(i + 9) * 14) * span * scale),
    } as UserProductivityRow;
    if (!s.active && base < 0.4) {
      PRODUCTIVITY_METRICS.forEach((m) => {
        if (row[m] < 2) row[m] = 0;
      });
    }
    return row;
  });
}

export type OperationalDayRow = {
  date: string;
} & Record<ProductivityMetric, number>;

export function buildOperationalDays(start: string, end: string): OperationalDayRow[] {
  return daysInRange(start, end)
    .map((date, i) => {
      const n = seeded(i + date.length * 7);
      return {
        date,
        accepted: Math.round(80 + n * 420),
        rejected: Math.round(20 + seeded(i + 1) * 180),
        photographed: Math.round(70 + seeded(i + 2) * 380),
        posted: Math.round(60 + seeded(i + 3) * 360),
        shelved: Math.round(10 + seeded(i + 4) * 80),
        purged: Math.round(5 + seeded(i + 5) * 40),
        picked: Math.round(40 + seeded(i + 6) * 200),
        packed: Math.round(35 + seeded(i + 7) * 180),
        shipped: Math.round(30 + seeded(i + 8) * 160),
      };
    })
    .reverse();
}

export type PosterOverviewRow = {
  dateRange: string;
  poster: string;
  postingsActual: number;
  postingsTarget: number;
  totalHours: number;
  averagePct: number;
  postingsPerHourActual: number;
  postingsPerHourTarget: number;
};

export function buildPosterOverview(start: string, end: string): PosterOverviewRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  const label =
    start === end
      ? start.slice(5).replace("-", "/")
      : `${start.slice(5).replace("-", "/")} – ${end.slice(5).replace("-", "/")}`;

  return REPORT_STAFF.filter((s) => s.active)
    .slice(0, 48)
    .map((s, i) => {
      const hours = Math.round((4 + seeded(i + 11) * 6) * 100) / 100;
      const target = 48 * Math.max(1, Math.round(span / 7));
      const actual = Math.round((20 + seeded(i + 12) * 90) * Math.min(span, 7) * (0.4 + seeded(i)));
      const pph = hours > 0 ? Math.round((actual / hours) * 100) / 100 : 0;
      return {
        dateRange: label,
        poster: s.handle,
        postingsActual: actual,
        postingsTarget: target,
        totalHours: hours * Math.min(span, 5),
        averagePct: Math.round((actual / target) * 10000) / 100,
        postingsPerHourActual: pph,
        postingsPerHourTarget: 6,
      };
    });
}

export type PosterTargetRow = {
  poster: string;
  actual: number;
  target: number;
};

export function buildPosterTargets(start: string, end: string): PosterTargetRow[] {
  return buildPosterOverview(start, end)
    .slice(0, 18)
    .map((r) => ({
      poster: r.poster,
      actual: r.postingsActual,
      target: r.postingsTarget,
    }));
}

export type ManifestAcceptanceRow = {
  supplier: string;
  totalItems: number;
  unprocessed: number;
  processed: number;
  accepted: number;
  rejected: number;
  activeListings: number;
  sold: number;
  avgSalePrice: number;
  totalRevenue: number;
  unprocessedRate: number;
  processedRate: number;
  acceptanceRate: number;
  rejectionRate: number;
  sellThruRate: number;
};

export function buildManifestAcceptance(start: string, end: string): ManifestAcceptanceRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  return SUPPLIERS.map((supplier, i) => {
    const totalItems = Math.round((400 + seeded(i + 20) * 2400) * (span / 14));
    const processed = Math.round(totalItems * (0.82 + seeded(i) * 0.14));
    const unprocessed = totalItems - processed;
    const accepted = Math.round(processed * (0.78 + seeded(i + 1) * 0.16));
    const rejected = processed - accepted;
    const sold = Math.round(accepted * (0.18 + seeded(i + 2) * 0.22));
    const activeListings = Math.max(0, accepted - sold - Math.round(accepted * 0.05));
    const avgSalePrice = Math.round((18 + seeded(i + 3) * 55) * 100) / 100;
    return {
      supplier,
      totalItems,
      unprocessed,
      processed,
      accepted,
      rejected,
      activeListings,
      sold,
      avgSalePrice,
      totalRevenue: Math.round(sold * avgSalePrice * 100) / 100,
      unprocessedRate: Math.round((unprocessed / totalItems) * 1000) / 10,
      processedRate: Math.round((processed / totalItems) * 1000) / 10,
      acceptanceRate: Math.round((accepted / Math.max(1, processed)) * 1000) / 10,
      rejectionRate: Math.round((rejected / Math.max(1, processed)) * 1000) / 10,
      sellThruRate: Math.round((sold / Math.max(1, accepted)) * 1000) / 10,
    };
  });
}

export type ManifestByUserRow = {
  username: string;
  manifestCount: number;
  manifestItemCount: number;
};

export function buildManifestsByUser(start: string, end: string): ManifestByUserRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  return REPORT_STAFF.filter((s) => s.active)
    .slice(0, 24)
    .map((s, i) => ({
      username: s.handle,
      manifestCount: Math.round((2 + seeded(i + 30) * 18) * (span / 10)),
      manifestItemCount: Math.round((40 + seeded(i + 31) * 380) * (span / 10)),
    }))
    .sort((a, b) => b.manifestItemCount - a.manifestItemCount);
}

export type TopSaleRow = {
  rank: number;
  title: string;
  thumbnail: string;
  poster: string;
  supplier: string;
  salePrice: number;
  channel: "ShopGoodwill" | "eBay";
  channelId: string;
  soldAt: string;
};

export function buildTopSales(start: string, end: string): TopSaleRow[] {
  const days = daysInRange(start, end);
  return Array.from({ length: 50 }, (_, i) => {
    const product = products[i % products.length];
    const day = days[i % Math.max(1, days.length)] ?? start;
    return {
      rank: i + 1,
      title: product?.title ?? `Featured item ${i + 1}`,
      thumbnail: product?.imageUrls?.[0] ?? "/hammoq-logo.png",
      poster: REPORT_STAFF[i % 40].handle,
      supplier: product?.supplier ?? SUPPLIERS[i % SUPPLIERS.length],
      salePrice: Math.round((4200 - i * 72 - seeded(i) * 40) * 100) / 100,
      channel: i % 2 === 0 ? "ShopGoodwill" : "eBay",
      channelId: String(880000 + i * 17),
      soldAt: `${day}T${String(10 + (i % 8)).padStart(2, "0")}:0${i % 6}:00`,
    };
  });
}

export type EventLogReportRow = {
  timestamp: string;
  resource: string;
  resourceHref: string;
  event: string;
  user: string;
  ip: string;
};

const EVENT_TEMPLATES: Array<(u: string, r: string) => string> = [
  (u) => `${u} packed this order`,
  (u) => `${u} purged this product`,
  (u) => `${u} failed to log in`,
  (u, r) => `${u} picked product ${r}`,
  (u) => `${u} accepted intake items`,
  (u) => `${u} shipped this order`,
  () => `${BRAND.ai} Auto-Listed this product`,
  (u) => `${u} updated listing price`,
];

export function buildEventLogs(start: string, end: string): EventLogReportRow[] {
  const days = daysInRange(start, end);
  const rows: EventLogReportRow[] = [];
  let n = 0;
  for (let d = days.length - 1; d >= 0 && rows.length < 80; d--) {
    const perDay = 3 + Math.floor(seeded(d + 40) * 5);
    for (let j = 0; j < perDay && rows.length < 80; j++) {
      const staff = REPORT_STAFF[n % REPORT_STAFF.length];
      const kind = n % 4;
      const resource =
        kind === 0
          ? `Order #${23248000 + n}`
          : kind === 1
            ? `Product #${41758000 + n}`
            : kind === 2
              ? `Donor batch #${5702800 + n}`
              : `User #${23000 + (n % 200)}`;
      const href =
        kind === 0
          ? "/orders"
          : kind === 1
            ? "/products"
            : kind === 2
              ? "/manifests"
              : "/admin/users";
      const tpl = EVENT_TEMPLATES[n % EVENT_TEMPLATES.length];
      rows.push({
        timestamp: `${days[d]}T${String(8 + (j % 10)).padStart(2, "0")}:${String((n * 7) % 60).padStart(2, "0")}:${String((n * 13) % 60).padStart(2, "0")}`,
        resource,
        resourceHref: href,
        event: tpl(staff.handle, resource),
        user: staff.handle,
        ip: `10.${(n % 40) + 1}.${(n % 200) + 10}.${(n % 250) + 1}`,
      });
      n++;
    }
  }
  return rows;
}

export type CategorySalesRow = {
  category: string;
  totalSales: number;
  itemsSold: number;
  avgPpi: number;
};

const CATEGORY_BRANCHES: Record<string, string[]> = {
  Art: ["Drawings", "Indigenous Art", "Paintings", "Prints", "Sculpture"],
  Electronics: ["Audio", "Cameras", "Computers", "Phones", "TVs"],
  Apparel: ["Men", "Women", "Kids", "Shoes", "Accessories"],
  "Home Goods": ["Kitchen", "Decor", "Furniture", "Bedding", "Lighting"],
  Sports: ["Outdoor", "Fitness", "Team Sports", "Cycling"],
  Collectibles: ["Coins", "Trading Cards", "Memorabilia", "Antiques"],
  "Books & Media": ["Books", "DVDs", "Vinyl", "Games"],
  Toys: ["Action Figures", "Board Games", "LEGO", "Dolls"],
};

export function buildSalesByCategory(start: string, end: string): CategorySalesRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  const rows: CategorySalesRow[] = [];
  Object.entries(CATEGORY_BRANCHES).forEach(([parent, children], pi) => {
    children.forEach((child, ci) => {
      const itemsSold = Math.round((12 + seeded(pi * 10 + ci + span) * 90) * (span / 10));
      const avgPpi = Math.round((8 + seeded(pi + ci + 5) * 120) * 100) / 100;
      rows.push({
        category: `${parent} > ${child}`,
        totalSales: Math.round(itemsSold * avgPpi * 100) / 100,
        itemsSold,
        avgPpi,
      });
    });
  });
  // Also include top-level categories from mock
  CATEGORIES.slice(0, 4).forEach((c, i) => {
    if (!CATEGORY_BRANCHES[c]) {
      const itemsSold = Math.round((20 + seeded(i + 99) * 60) * (span / 10));
      const avgPpi = Math.round((15 + seeded(i + 88) * 40) * 100) / 100;
      rows.push({
        category: c,
        totalSales: Math.round(itemsSold * avgPpi * 100) / 100,
        itemsSold,
        avgPpi,
      });
    }
  });
  return rows.sort((a, b) => b.totalSales - a.totalSales);
}

export type SupplierSalesRow = {
  name: string;
  amount: number;
  itemsListed: number;
  itemsSold: number;
  avgDaysToSell: number;
  spark: number[];
};

export function buildSupplierSalesOverview(start: string, end: string): SupplierSalesRow[] {
  const span = Math.max(1, daysInRange(start, end).length);
  return SUPPLIERS.map((name, i) => ({
    name,
    amount: Math.round((9000 - i * 620 + seeded(i) * 800) * (span / 14) * 100) / 100,
    itemsListed: Math.round((400 - i * 22) * (span / 14)),
    itemsSold: Math.round((90 - i * 5) * (span / 14)),
    avgDaysToSell: 4 + (i % 7),
    spark: [6, 7, 8, 9, 10, 11, 12].map((n) => n + ((i * 2) % 5)),
  }));
}

export type IntakeItemRow = {
  sku: string;
  title: string;
  supplier: string;
  status: string;
  acceptedBy: string;
  createdAt: string;
};

export function buildIntakeItems(start: string, end: string): IntakeItemRow[] {
  const days = daysInRange(start, end);
  return Array.from({ length: 60 }, (_, i) => {
    const day = days[i % Math.max(1, days.length)] ?? start;
    const p = products[i % products.length];
    return {
      sku: p?.sku ?? `TGW${2000 + i}`,
      title: p?.title ?? `Intake item ${i + 1}`,
      supplier: p?.supplier ?? SUPPLIERS[i % SUPPLIERS.length],
      status: ["Accepted", "Rejected", "Unprocessed", "Processed"][i % 4],
      acceptedBy: REPORT_STAFF[i % 50].handle,
      createdAt: `${day}T09:00:00`,
    };
  });
}

export type SupplierActivityRow = {
  user: string;
  supplier: string;
  actions: number;
  lastAction: string;
};

export function buildSupplierUserActivity(start: string, end: string): SupplierActivityRow[] {
  const days = daysInRange(start, end);
  return Array.from({ length: 40 }, (_, i) => ({
    user: REPORT_STAFF[i % 60].handle,
    supplier: SUPPLIERS[i % SUPPLIERS.length],
    actions: Math.round(5 + seeded(i + 50) * 80),
    lastAction: days[days.length - 1 - (i % Math.max(1, days.length))] ?? start,
  }));
}

export function sumMetrics(rows: Array<Record<ProductivityMetric, number>>) {
  return PRODUCTIVITY_METRICS.reduce(
    (acc, m) => {
      acc[m] = rows.reduce((s, r) => s + (r[m] || 0), 0);
      return acc;
    },
    {} as Record<ProductivityMetric, number>
  );
}

export function dashZero(n: number) {
  return n === 0 ? null : n;
}
