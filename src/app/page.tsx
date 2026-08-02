"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Camera,
  Package,
  Rocket,
  Truck,
  Users,
  Wand2,
  Wrench,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import {
  BRAND,
  ORG_NAME,
  dashboardStats,
  infinityStats,
} from "@/lib/mock-data";
import {
  DEFAULT_HOME_PERIOD,
  HOME_PERIODS,
  homeMetricsByPeriod,
  type HomePeriod,
} from "@/lib/home-metrics";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

export default function HomePage() {
  const [period, setPeriod] = useState<HomePeriod>(DEFAULT_HOME_PERIOD);
  const m = homeMetricsByPeriod[period];
  const s = dashboardStats;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-8 text-white sm:px-10 sm:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(240,180,41,0.32), transparent 42%), radial-gradient(circle at 88% 10%, rgba(232,122,26,0.26), transparent 38%)",
          }}
        />
        <div className="relative animate-rise">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white/55">{ORG_NAME}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
                {BRAND.product}
              </p>
            </div>
            <div
              className="inline-flex rounded-xl bg-white/10 p-1"
              role="tablist"
              aria-label="Sales period"
            >
              {HOME_PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={period === p.id}
                  onClick={() => setPeriod(p.id)}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                    period === p.id
                      ? "bg-accent text-accent-ink shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Top line revenue · {m.periodLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-4">
            <h1 className="font-display text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl lg:text-7xl">
              {formatCurrency(m.topLineRevenue)}
            </h1>
            <div className="mb-2 rounded-xl bg-white/10 p-2.5">
              <Sparkline values={m.salesSpark} className="text-accent" width={140} height={36} />
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm text-white/65 sm:text-base">
            {m.rangeLabel} · {formatNumber(m.paidOrders)} paid orders ·{" "}
            {formatNumber(m.unitsSold)} units sold
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                ASP
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl">
                {formatCurrency(m.asp)}
              </p>
              <p className="mt-2 text-sm text-white/55">Average selling price</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                Sell through
              </p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl">
                {m.sellThrough.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-white/55">Units sold ÷ units listed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-rise-delay-1">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Top 50 sales</h2>
            <p className="text-sm text-muted">Highest sold items · {m.periodLabel.toLowerCase()}</p>
          </div>
          <Link
            href="/reports/top-sales"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline"
          >
            Full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 border-b border-ink/8 bg-white/95 text-xs uppercase tracking-wide text-muted backdrop-blur">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-3 py-2.5 font-semibold">Title</th>
                  <th className="px-3 py-2.5 font-semibold">Channel</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Sold</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {m.topSales.map((row) => (
                  <tr key={`${period}-${row.rank}`} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-2.5 tabular-nums text-muted">{row.rank}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2.5 font-medium text-ink sm:max-w-none">
                      {row.title}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone={row.channel === "eBay" ? "blue" : "orange"}>{row.channel}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                      {formatCurrency(row.soldPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                      {new Date(row.soldAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 animate-rise-delay-2">
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Top listers</h2>
              <p className="text-sm text-muted">Listings posted · {m.periodLabel.toLowerCase()}</p>
            </div>
            <Link
              href="/reports/productivity"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline"
            >
              Full report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="p-2 sm:p-3">
            <ul className="divide-y divide-ink/5">
              {m.topListers.map((row) => (
                <li
                  key={`${period}-lister-${row.handle}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink/5 font-display text-xs font-bold tabular-nums text-ink">
                      {row.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{row.name}</p>
                      <p className="text-xs text-muted">@{row.handle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-ink">
                      {formatNumber(row.listed)} listed
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {formatCurrency(row.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-orange" />
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Top photographers</h2>
              <p className="text-sm text-muted">Photo volume · {m.periodLabel.toLowerCase()}</p>
            </div>
          </div>
          <Card className="p-2 sm:p-3">
            <ul className="divide-y divide-ink/5">
              {m.topPhotographers.map((row) => (
                <li
                  key={`${period}-photo-${row.handle}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 font-display text-xs font-bold tabular-nums text-ink">
                      {row.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{row.name}</p>
                      <p className="text-xs text-muted">@{row.handle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-ink">
                      {formatNumber(row.photos)} photos
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {formatNumber(row.items)} items
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 animate-rise-delay-3">
        <Link href="/orders?fulfillment=Unfulfilled">
          <Card className="h-full border-coral/20 bg-coral/5 p-5 transition hover:-translate-y-0.5 hover:shadow-float">
            <div className="flex items-center gap-2 text-coral">
              <Truck className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">To ship</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
              {formatNumber(s.unfulfilledOrders)}
            </p>
            <p className="mt-1 text-sm text-muted">Unfulfilled orders waiting on labels</p>
          </Card>
        </Link>
        <Link href="/listings/ebay?status=Additional%20QA%20Required">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-float">
            <div className="flex items-center gap-2 text-coral">
              <Wrench className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Additional QA Required</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
              {formatNumber(s.failedListings)}
            </p>
            <p className="mt-1 text-sm text-muted">Listings blocked from selling</p>
          </Card>
        </Link>
        <Link href="/products?status=Draft">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-float">
            <div className="flex items-center gap-2 text-teal">
              <Package className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">In pipeline</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
              {formatNumber(infinityStats.autoDraftedToday + infinityStats.autoListedToday)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {formatNumber(infinityStats.autoDraftedToday)} Auto-Draft ·{" "}
              {formatNumber(infinityStats.autoListedToday)} Auto-List today
            </p>
          </Card>
        </Link>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-2 text-sm text-muted">
          <Users className="h-4 w-4" />
          <span>Tools</span>
        </div>
        <Link href="/products/auto-draft">
          <Button variant="outline" size="md" type="button">
            <Wand2 className="h-4 w-4" />
            {BRAND.autoDraft}
          </Button>
        </Link>
        <Link href="/products/auto-list">
          <Button variant="outline" size="md" type="button">
            <Rocket className="h-4 w-4" />
            {BRAND.autoList}
          </Button>
        </Link>
        <Link href="/reports/generate">
          <Button variant="ghost" size="md" type="button">
            Download reports
          </Button>
        </Link>
      </section>
    </div>
  );
}
