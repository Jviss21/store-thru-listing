"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FileBarChart,
  Home,
  List,
  Menu,
  Package,
  PlusCircle,
  Rocket,
  ScanBarcode,
  Settings,
  ShoppingCart,
  Sparkles,
  Truck,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BRAND, CURRENT_USER, ORG_NAME, notifications } from "@/lib/mock-data";

const floorActions = [
  {
    href: "/products/auto-draft",
    label: BRAND.autoDraft,
    icon: Wand2,
    hint: `${BRAND.ai} drafts`,
    primary: true,
  },
  {
    href: "/products/auto-list",
    label: BRAND.autoList,
    icon: Rocket,
    hint: "Push to channels",
    primary: false,
  },
  {
    href: "/products/express-list",
    label: BRAND.quickList,
    icon: ScanBarcode,
    hint: "Scan SKU & list",
    primary: false,
  },
];

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/manifests", label: "Item Creation", icon: ClipboardList },
  { href: "/products", label: "Products", icon: Package },
  { href: "/listings/shopgoodwill", label: "Listings", icon: List },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/listings")) return pathname.startsWith("/listings");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="flex h-full flex-col bg-white text-ink">
      <div className="border-b border-ink/10 px-5 pb-5 pt-6">
        <Link href="/" onClick={onNavigate} className="block">
          <p className="font-display text-xl font-bold tracking-tight text-ink">{ORG_NAME}</p>
          <p className="mt-1 text-[11px] font-medium text-muted">
            Powered by <span className="text-ink/70">{BRAND.product}</span>
          </p>
        </Link>
      </div>

      <div className="space-y-2 border-b border-ink/10 p-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            Infinity AI
          </p>
          <Sparkles className="h-3.5 w-3.5 text-teal" />
        </div>
        {floorActions.map((a) => {
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
        <Link
          href="/products/new"
          onClick={onNavigate}
          className="flex items-center gap-2 px-1 pt-1 text-xs font-semibold text-muted hover:text-ink"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Manual new product
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Workspace
        </p>
        {nav.map((item) => {
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
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/80 hover:bg-mist hover:text-ink"
        >
          <Settings className="h-4 w-4 text-muted" />
          Settings
        </Link>
        <div className="mt-1 flex items-center gap-3 rounded-xl bg-mist/80 px-3 py-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-accent">
            {CURRENT_USER.handle.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{CURRENT_USER.name}</p>
            <p className="truncate text-[11px] text-muted">{CURRENT_USER.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="min-h-screen lg:pl-[17rem]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-ink/10 bg-white shadow-[4px_0_24px_rgba(12,18,34,0.04)] lg:block">
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
        <span className="font-display text-base font-bold text-ink">{ORG_NAME}</span>
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
        <div key={pathname} className="animate-rise">
          {children}
        </div>
      </main>

      <Link
        href="/products/auto-list"
        className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-accent shadow-float transition hover:scale-[1.02] lg:hidden"
      >
        <Zap className="h-4 w-4" />
        Auto-List
      </Link>
    </div>
  );
}
