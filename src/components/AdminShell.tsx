"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Cable,
  Database,
  Home,
  LayoutDashboard,
  ListChecks,
  Printer,
  ScrollText,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND, ORG_NAME } from "@/lib/mock-data";
import { Badge } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { canViewMasterEventLog } from "@/lib/roles";
import { RoleGate } from "@/components/RoleGate";

const adminNav: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  masterOnly?: boolean;
}> = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/organization", label: "Organization", icon: Building2 },
  { href: "/admin/users", label: "Users & roles", icon: Users },
  { href: "/admin/marketplaces", label: "Marketplaces", icon: Cable },
  { href: "/admin/infinity-ai", label: BRAND.ai, icon: Sparkles },
  { href: "/admin/listing-defaults", label: "Listing defaults", icon: ListChecks },
  { href: "/admin/stations", label: "Printers & stations", icon: Printer },
  { href: "/admin/audit", label: "Master event log", icon: ScrollText, masterOnly: true },
  { href: "/admin/data", label: "Data & exports", icon: Database },
];

function isAdminActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, isOps } = useOrg();
  const showMaster = canViewMasterEventLog(session.role, isOps);
  const items = adminNav.filter((i) => !i.masterOnly || showMaster);

  return (
    <RoleGate path="/admin">
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink text-white shadow-card">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 80% at 100% 0%, rgba(240,180,41,0.18), transparent 55%)",
            }}
          />
          <div className="relative flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-ink">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Admin</h1>
                  <Badge tone="yellow" className="border border-accent/30 bg-accent/20 text-accent-ink">
                    Ops console
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-white/65">
                  {ORG_NAME} · store-thru-listing backend · powered by {BRAND.product}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10"
            >
              <Home className="h-3.5 w-3.5" />
              Floor workspace
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">
          <nav
            className="flex shrink-0 gap-1 overflow-x-auto pb-1 lg:w-52 lg:flex-col lg:overflow-visible lg:pb-0"
            aria-label="Admin sections"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const active = isAdminActive(pathname, item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-accent text-ink shadow-sm"
                      : "text-ink/75 hover:bg-mist hover:text-ink"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-ink" : "text-muted")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 animate-rise">{children}</div>
        </div>
      </div>
    </RoleGate>
  );
}
