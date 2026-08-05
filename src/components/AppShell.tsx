"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FileBarChart,
  Home,
  Link2,
  List,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Rocket,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { BRAND, notifications } from "@/lib/mock-data";
import DemoBanner from "@/components/DemoBanner";
import { useOrg } from "@/components/OrgProvider";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { canAccessNav, canViewMasterEventLog, type NavSection } from "@/lib/roles";

const floorActions = [
  {
    href: "/products/auto-list",
    label: BRAND.autoList,
    icon: Rocket,
    hint: "Push to channels",
    primary: true,
    section: "auto-list" as NavSection,
  },
];

const nav: Array<{ href: string; label: string; icon: typeof Home; section: NavSection }> = [
  { href: "/", label: "Home", icon: Home, section: "home" },
  { href: "/manifests", label: "Donor Item Creation", icon: ClipboardList, section: "manifests" },
  { href: "/products", label: "Products", icon: Package, section: "products" },
  { href: "/listings/shopgoodwill", label: "Listings", icon: List, section: "listings" },
  { href: "/orders", label: "Orders", icon: ShoppingCart, section: "orders" },
  { href: "/shipments", label: "Shipments", icon: Truck, section: "shipments" },
  { href: "/reports", label: "Reports", icon: FileBarChart, section: "reports" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/listings")) return pathname.startsWith("/listings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const unread = notifications.filter((n) => n.unread).length;
  const { org, session, isOps } = useOrg();
  const role = session.role;
  const showMasterLog = canViewMasterEventLog(role, isOps);
  const showAdmin = canAccessNav("admin", role, isOps);
  const showConnections = canAccessNav("connections", role, isOps);
  const visibleNav = nav.filter((item) => canAccessNav(item.section, role, isOps));
  const visibleFloor = floorActions.filter((a) => canAccessNav(a.section, role, isOps));

  return (
    <div className="flex h-full flex-col bg-white text-ink">
      <div className="border-b border-ink/10 px-5 pb-5 pt-6">
        <Link href="/" onClick={onNavigate} className="block">
          <p className="font-display text-xl font-bold tracking-tight text-ink">{org.name}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted">
            Powered by
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hammoq-logo.png"
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 rounded-full object-cover opacity-80"
            />
            <span className="text-ink/70">{BRAND.product}</span>
          </p>
        </Link>
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Active org
          </p>
          <OrgSwitcher />
        </div>
      </div>

      {visibleFloor.length > 0 && (
        <div className="space-y-2 border-b border-ink/10 p-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Infinity AI
            </p>
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </div>
          {visibleFloor.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                  a.primary
                    ? "bg-ink text-white shadow-card hover:bg-ink/90"
                    : "border border-ink/10 bg-mist/60 hover:border-ink/20 hover:bg-mist"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    a.primary ? "bg-accent text-ink" : "bg-white text-ink shadow-sm"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{a.label}</span>
                  <span className={cn("block text-[11px]", a.primary ? "text-white/70" : "text-muted")}>
                    {a.hint}
                  </span>
                </span>
              </Link>
            );
          })}
          {canAccessNav("manifests", role, isOps) && (
            <Link
              href="/manifests/new"
              onClick={onNavigate}
              className="flex items-center gap-2 px-1 pt-1 text-xs font-semibold text-muted hover:text-ink"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Manual create
            </Link>
          )}
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Workspace
        </p>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-accent text-ink shadow-sm"
                  : "text-ink/80 hover:bg-mist hover:text-ink"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-ink" : "text-muted")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-ink/10 p-3">
        <Link
          href="/notifications"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-mist hover:text-ink"
        >
          <Bell className="h-4 w-4 text-muted" />
          Alerts
          {unread > 0 && (
            <span className="ml-auto rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
        {showMasterLog && (
          <Link
            href="/admin/audit"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              pathname.startsWith("/admin/audit") || pathname.startsWith("/reports/events")
                ? "bg-ink text-accent shadow-sm"
                : "text-ink/80 hover:bg-mist hover:text-ink"
            )}
          >
            <ScrollText
              className={cn(
                "h-4 w-4",
                pathname.startsWith("/admin/audit") ? "text-accent" : "text-muted"
              )}
            />
            Event log
          </Link>
        )}
        {showAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              pathname.startsWith("/admin") && !pathname.startsWith("/admin/audit")
                ? "bg-ink text-accent shadow-sm"
                : "text-ink/80 hover:bg-mist hover:text-ink"
            )}
          >
            <Shield
              className={cn(
                "h-4 w-4",
                pathname.startsWith("/admin") && !pathname.startsWith("/admin/audit")
                  ? "text-accent"
                  : "text-muted"
              )}
            />
            Admin
          </Link>
        )}
        {showConnections && (
          <Link
            href="/settings/connections"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              pathname.startsWith("/settings/connections")
                ? "bg-accent text-ink shadow-sm"
                : "text-ink/80 hover:bg-mist hover:text-ink"
            )}
          >
            <Link2 className="h-4 w-4 text-muted" />
            Connections
          </Link>
        )}
        <Link
          href="/settings/account"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            pathname.startsWith("/settings") && !pathname.startsWith("/settings/connections")
              ? "bg-accent text-ink shadow-sm"
              : "text-ink/80 hover:bg-mist hover:text-ink"
          )}
        >
          <Settings className={cn("h-4 w-4", pathname.startsWith("/settings") && !pathname.startsWith("/settings/connections") ? "text-ink" : "text-muted")} />
          Settings
        </Link>
        {isOps && (
          <Link
            href="/ops"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              pathname.startsWith("/ops")
                ? "bg-ink text-accent shadow-sm"
                : "border border-dashed border-ink/20 text-ink/80 hover:bg-mist hover:text-ink"
            )}
          >
            <Shield className="h-4 w-4 text-accent" />
            Hammoq Ops
          </Link>
        )}
        <div className="mt-1 flex items-center gap-3 rounded-xl bg-mist/80 px-3 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-accent">
            {(session.handle || session.email || "??").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{session.name || "Signed in"}</p>
            <p className="truncate text-[11px] text-muted">{session.role}</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => void signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const unread = notifications.filter((n) => n.unread).length;
  const { org, session, isOps } = useOrg();
  const showAutoListFab = canAccessNav("auto-list", session.role, isOps);

  if (pathname === "/login" || pathname.startsWith("/ops")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen lg:pl-[17rem]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-ink/10 bg-white shadow-[4px_0_24px_rgba(13,27,52,0.04)] lg:block">
        <Sidebar />
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink/10 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        <button
          className="rounded-xl p-2 text-ink hover:bg-mist"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-base font-bold text-ink">{org.name}</span>
        <Link href="/notifications" className="relative ml-auto rounded-xl p-2 text-ink hover:bg-mist">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
          )}
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-label="Close"
          />
          <aside className="absolute inset-y-0 left-0 w-80 border-r border-ink/10 bg-white shadow-float">
            <button
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-ink hover:bg-mist"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
        <DemoBanner />
        <div key={pathname} className="animate-rise">
          {children}
        </div>
      </main>

      {showAutoListFab && (
        <Link
          href="/products/auto-list"
          className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-accent shadow-float transition hover:scale-[1.02] lg:hidden"
        >
          <Zap className="h-4 w-4" />
          Auto-List
        </Link>
      )}
    </div>
  );
}
