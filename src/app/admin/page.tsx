"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Cable,
  ListOrdered,
  Rocket,
  Users,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { Sparkline } from "@/components/Sparkline";
import { BRAND, dashboardStats } from "@/lib/mock-data";
import { getAdminOverviewMetrics, isAdminCapable } from "@/lib/admin-data";
import { CURRENT_USER } from "@/lib/mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

const quickLinks = [
  { href: "/admin/teammates", label: "Teammates" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/products", label: "Product settings" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/channels/shopgoodwill", label: "ShopGoodwill" },
  { href: "/admin/audit", label: "Master event log" },
  { href: "/admin/infinity-ai", label: BRAND.ai },
];

export default function AdminOverviewPage() {
  const m = getAdminOverviewMetrics();
  const canAdmin = isAdminCapable(CURRENT_USER.role);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink">Admin</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Org configuration for inventory ops — teammates, channels, listing strategies, shipping,
          and audit. Signed in as {CURRENT_USER.name} ({CURRENT_USER.role}
          {canAdmin ? " — admin-capable" : ""}).
        </p>
        <ol className="mt-2 max-w-2xl list-decimal space-y-0.5 pl-4 text-sm text-muted">
          <li>Use the Admin sidebar sections (Team, Channels, Products & Listing, …).</li>
          <li>Start with Teammates / Roles, then channel connections and listing strategies.</li>
          <li>Master event log (Admin only) shows the full cross-system audit trail.</li>
        </ol>
      </div>

      <Card className="border-accent/35 bg-accent/10 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-ink">Master event log</p>
            <p className="mt-1 text-sm text-muted">
              Full org audit trail with section and date filters. Admin / Hammoq Ops only.
            </p>
          </div>
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
          >
            Open Master event log
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Users online</p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
            {m.onlineUsers}
          </p>
          <p className="mt-1 text-xs text-muted">{m.activeUsers} active accounts</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <ListOrdered className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Queued</p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
            {formatNumber(m.queuedListings)}
          </p>
          <p className="mt-1 text-xs text-muted">
            SGW {formatNumber(m.pendingSgw)} · eBay {formatNumber(m.pendingEbay)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-coral">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Additional QA Required
            </p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
            {formatNumber(m.additionalQaRequired)}
          </p>
          <p className="mt-1 text-xs text-muted">Failed / held listings need review</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted">
            <Rocket className="h-4 w-4 text-brand-orange" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {BRAND.autoList} today
            </p>
          </div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
            {formatNumber(m.autoListedToday)}
          </p>
          <p className="mt-1 text-xs text-muted">{BRAND.ai} published volume</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Sales snapshot
              </p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
                {formatCurrency(m.salesYesterday)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Yesterday · {formatNumber(m.paidOrdersYesterday)} paid ·{" "}
                {formatNumber(m.unfulfilledOrders)} unfulfilled
              </p>
            </div>
            <Sparkline values={dashboardStats.salesSpark} className="text-accent" width={120} height={40} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="yellow">Queued pipeline healthy</Badge>
            <Badge tone="orange">{formatNumber(m.failedListings)} channel failures</Badge>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Cable className="h-4 w-4 text-muted" />
            <p className="text-sm font-semibold text-ink">Quick links</p>
          </div>
          <ul className="space-y-1.5">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between rounded-xl px-2.5 py-2 text-sm font-semibold text-ink/80 hover:bg-mist"
                >
                  {l.label}
                  <ArrowRight className="h-3.5 w-3.5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
