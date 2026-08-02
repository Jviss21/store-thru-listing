import Link from "next/link";
import { ArrowRight, Package, Rocket, Truck, Wand2, Wrench } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import {
  BRAND,
  ORG_NAME,
  dashboardStats,
  infinityStats,
  weeklySupplierSales,
} from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function HomePage() {
  const s = dashboardStats;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[1.75rem] bg-ink px-6 py-10 text-white sm:px-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 20%, rgba(200,241,53,0.3), transparent 42%), radial-gradient(circle at 88% 10%, rgba(15,118,110,0.28), transparent 38%)",
          }}
        />
        <div className="relative animate-rise">
          <p className="text-sm font-medium text-white/55">{ORG_NAME}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Yesterday&apos;s sales
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl lg:text-7xl">
            {formatCurrency(s.salesYesterday)}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/65">
            {formatNumber(s.paidOrdersYesterday)} paid orders · keep inventory moving to protect today&apos;s number.
          </p>
          <div className="mt-6 inline-flex rounded-2xl bg-white/10 p-3">
            <Sparkline values={s.salesSpark} className="text-accent" width={160} height={44} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 animate-rise-delay-1">
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
        <Link href="/listings/ebay?status=Needs%20Fix">
          <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-float">
            <div className="flex items-center gap-2 text-coral">
              <Wrench className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Needs Fix</p>
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

      <section className="flex flex-wrap gap-3 animate-rise-delay-2">
        <Link href="/products/auto-draft">
          <Button variant="accent" size="lg" type="button">
            <Wand2 className="h-4 w-4" />
            {BRAND.autoDraft}
          </Button>
        </Link>
        <Link href="/products/auto-list">
          <Button variant="outline" size="lg" type="button">
            <Rocket className="h-4 w-4" />
            {BRAND.autoList}
          </Button>
        </Link>
        <Link href="/reports/generate">
          <Button variant="outline" size="lg" type="button">
            Download reports
          </Button>
        </Link>
      </section>

      <section className="animate-rise-delay-3">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Top suppliers this week</h2>
            <p className="text-sm text-muted">Where yesterday&apos;s sales are coming from</p>
          </div>
          <Link href="/reports/suppliers" className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
            Full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Card className="p-2 sm:p-3">
          <ul className="divide-y divide-ink/5">
            {weeklySupplierSales.slice(0, 5).map((row) => (
              <li key={row.name} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                <span className="truncate font-medium text-ink">{row.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">{formatCurrency(row.amount)}</span>
                  <Sparkline values={row.spark} width={56} height={22} className="text-teal" />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
