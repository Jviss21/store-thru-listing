"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Package,
  Rocket,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { HomeSalesChart } from "@/components/HomeSalesChart";
import {
  BRAND,
  dashboardStats,
  infinityStats,
} from "@/lib/mock-data";
import {
  DEFAULT_HOME_PERIOD,
  HOME_PERIODS,
  defaultCustomRange,
  getHomeMetrics,
  normalizeCustomRange,
  type HomeCustomRange,
  type HomePeriod,
} from "@/lib/home-metrics";
import { formatDisplayDateLong, inclusiveDayCount } from "@/lib/report-dates";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";

function formatSoldAt(iso: string, hourly: boolean) {
  const d = new Date(iso);
  if (hourly) {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString();
}

const dateFieldClass =
  "h-9 w-full min-w-0 rounded-lg border border-white/15 bg-white/10 px-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-accent/60 focus:ring-2 focus:ring-accent/30";

export default function HomePage() {
  const [period, setPeriod] = useState<HomePeriod>(DEFAULT_HOME_PERIOD);
  const [customRange, setCustomRange] = useState<HomeCustomRange>(() => defaultCustomRange());
  const m = getHomeMetrics(period, customRange);
  const s = dashboardStats;
  const { org } = useOrg();
  const metricsKey =
    period === "custom"
      ? `custom-${customRange.start}-${customRange.end}`
      : period;

  function updateCustom(next: Partial<HomeCustomRange>) {
    setCustomRange((prev) =>
      normalizeCustomRange(next.start ?? prev.start, next.end ?? prev.end)
    );
    setPeriod("custom");
  }

  const customDayCount = inclusiveDayCount(customRange.start, customRange.end);
  /** Day keeps the daily summary; Hour owns the dedicated hourly chart + table. */
  const showSalesChart = period !== "day";
  const showHourTable = period === "hour" && m.hourRows.length > 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-float">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(240,180,41,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(232,122,26,0.08), transparent 50%)",
          }}
        />
        <div className="relative animate-rise px-5 py-7 pl-6 sm:px-9 sm:py-9 sm:pl-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold tracking-tight text-white">
                {org.name}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
                Powered by {BRAND.product}
              </p>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
                Sales dashboard for this workspace — pick a period below, then jump to{" "}
                <Link href="/infinity-ai" className="font-semibold text-accent hover:underline">
                  {BRAND.ai}
                </Link>{" "}
                for photos → listings or{" "}
                <Link href="/manifests" className="font-semibold text-accent hover:underline">
                  Donor Item Creation
                </Link>{" "}
                to intake units.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <div
                className="inline-flex flex-wrap rounded-xl border border-white/15 bg-[var(--ink-soft)] p-1 shadow-inner"
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
                      "inline-flex min-w-[4.25rem] items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                      period === p.id
                        ? "bg-accent text-accent-ink shadow-sm"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {p.id === "custom" ? (
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    ) : null}
                    {p.label}
                  </button>
                ))}
              </div>
              {period === "custom" ? (
                <div
                  className="flex flex-col items-stretch gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 sm:items-end"
                  role="group"
                  aria-label="Custom date range"
                >
                  <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                    <label className="block min-w-[8.5rem] flex-1">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        From
                      </span>
                      <input
                        type="date"
                        value={customRange.start}
                        max={customRange.end}
                        onChange={(e) => updateCustom({ start: e.target.value })}
                        className={dateFieldClass}
                      />
                      <span className="mt-1 block text-[11px] text-white/55">
                        {formatDisplayDateLong(customRange.start)}
                      </span>
                    </label>
                    <label className="block min-w-[8.5rem] flex-1">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        To
                      </span>
                      <input
                        type="date"
                        value={customRange.end}
                        min={customRange.start}
                        onChange={(e) => updateCustom({ end: e.target.value })}
                        className={dateFieldClass}
                      />
                      <span className="mt-1 block text-[11px] text-white/55">
                        {formatDisplayDateLong(customRange.end)}
                      </span>
                    </label>
                  </div>
                  <p className="text-[11px] text-white/45">
                    {customDayCount === 1
                      ? "1 calendar day · chart by hour"
                      : customDayCount === 2
                        ? "2 calendar days · chart by hour"
                        : `${customDayCount} calendar days inclusive · chart by day`}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-7 border-t border-white/10 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Top line revenue · {m.periodLabel}
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-3">
              <h1 className="font-display text-5xl font-extrabold tracking-tight text-white tabular-nums sm:text-6xl lg:text-[4.25rem] lg:leading-none">
                {formatCurrency(m.topLineRevenue)}
              </h1>
              <div className="mb-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Sparkline values={m.salesSpark} className="text-accent" width={140} height={36} />
              </div>
            </div>
            <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-[15px]">
              {m.rangeLabel} · {formatNumber(m.paidOrders)} paid orders ·{" "}
              {formatNumber(m.unitsSold)} units sold
            </p>
          </div>

          {showSalesChart ? (
            <div className="mt-6">
              <HomeSalesChart
                key={metricsKey}
                values={m.salesSpark}
                labels={m.sparkLabels}
                granularity={m.sparkGranularity}
              />
            </div>
          ) : null}

          {showHourTable ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[var(--ink-soft)]">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Sales by hour
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    Business hours · 8am–8pm · units + revenue
                  </p>
                </div>
                <p className="text-xs tabular-nums text-white/55">
                  {formatNumber(m.unitsSold)} units · {formatCurrency(m.topLineRevenue)}
                </p>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead className="sticky top-0 border-b border-white/10 bg-ink/80 text-[10px] uppercase tracking-wide text-white/45 backdrop-blur">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Hour</th>
                      <th className="px-3 py-2.5 font-semibold text-right">Units</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.hourRows.map((row) => {
                      const isPeak =
                        row.units === Math.max(...m.hourRows.map((h) => h.units));
                      return (
                        <tr
                          key={`${metricsKey}-hour-${row.hour}`}
                          className={cn(
                            "border-b border-white/5 last:border-0",
                            isPeak ? "bg-accent/10" : "hover:bg-white/5"
                          )}
                        >
                          <td
                            className={cn(
                              "px-4 py-2 font-medium tabular-nums",
                              isPeak ? "text-accent" : "text-white/85"
                            )}
                          >
                            {row.label}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-white/80">
                            {formatNumber(row.units)}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold tabular-nums text-white">
                            {formatCurrency(row.revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                ASP
              </p>
              <p className="mt-1.5 font-display text-2xl font-bold text-white tabular-nums sm:text-3xl">
                {formatCurrency(m.asp)}
              </p>
              <p className="mt-1.5 text-sm text-white/55">Average selling price</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[var(--ink-soft)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                Sell through
              </p>
              <p className="mt-1.5 font-display text-2xl font-bold text-white tabular-nums sm:text-3xl">
                {m.sellThrough.toFixed(1)}%
              </p>
              <p className="mt-1.5 text-sm text-white/55">Units sold ÷ units listed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-rise-delay-1">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Top 50 sales</h2>
            <p className="text-sm text-muted">Highest sold items · {m.periodLabel}</p>
          </div>
          <Link
            href="/reports/top-sales"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
          >
            Full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Card className="overflow-hidden">
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="sticky top-0 border-b border-ink/10 bg-mist/90 text-xs uppercase tracking-wide text-muted backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold">Title</th>
                  <th className="px-3 py-3 font-semibold">Channel</th>
                  <th className="px-3 py-3 font-semibold text-right">Sold</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    {m.sparkGranularity === "hour" ? "Sold at" : "Date"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {m.topSales.map((row) => (
                  <tr
                    key={`${metricsKey}-${row.rank}`}
                    className="border-b border-ink/5 transition hover:bg-mist/40 last:border-0"
                  >
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
                      {formatSoldAt(row.soldAt, m.sparkGranularity === "hour")}
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
              <p className="text-sm text-muted">Listings posted · {m.periodLabel}</p>
            </div>
            <Link
              href="/reports/productivity"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
            >
              Full report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="p-2 sm:p-3">
            <ul className="divide-y divide-ink/5">
              {m.topListers.map((row) => (
                <li
                  key={`${metricsKey}-lister-${row.handle}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-mist/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink font-display text-xs font-bold tabular-nums text-accent">
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
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="flex items-start gap-2">
              <Camera className="mt-1 h-4 w-4 shrink-0 text-brand-orange" />
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Top photographers</h2>
                <p className="text-sm text-muted">Photo volume · {m.periodLabel}</p>
              </div>
            </div>
            <Link
              href="/reports/productivity"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
            >
              Full report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <Card className="p-2 sm:p-3">
            <ul className="divide-y divide-ink/5">
              {m.topPhotographers.map((row) => (
                <li
                  key={`${metricsKey}-photo-${row.handle}`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm transition hover:bg-mist/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-xs font-bold tabular-nums text-accent-ink">
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
            <div className="flex items-center gap-2 text-brand-orange">
              <Package className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">In pipeline</p>
            </div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
              {formatNumber(infinityStats.autoListedToday)}
            </p>
            <p className="mt-1 text-sm text-muted">
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
        <Link href="/products/auto-list">
          <Button variant="outline" size="md" type="button">
            <Rocket className="h-4 w-4" />
            {BRAND.autoList}
          </Button>
        </Link>
        <Link href="/reports/downloads">
          <Button variant="ghost" size="md" type="button">
            Download reports
          </Button>
        </Link>
      </section>

      <SectionEventLog section="products" title="Event log" limit={8} defaultOpen />
    </div>
  );
}
