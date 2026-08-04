"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND, ORG_NAME } from "@/lib/mock-data";
import { Badge } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import { canViewMasterEventLog } from "@/lib/roles";
import { RoleGate } from "@/components/RoleGate";
import { ADMIN_NAV_GROUPS, isAdminNavActive } from "@/lib/admin-nav";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, isOps } = useOrg();
  const showMaster = canViewMasterEventLog(session.role, isOps);

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
                    IMS settings
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-white/65">
                  {ORG_NAME} · operational settings · powered by {BRAND.product}
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
            className="flex shrink-0 flex-col gap-4 overflow-x-auto pb-1 lg:w-56 lg:overflow-visible lg:pb-0"
            aria-label="Admin sections"
          >
            {ADMIN_NAV_GROUPS.map((group) => {
              const items = group.items.filter((i) => !i.masterOnly || showMaster);
              if (!items.length) return null;
              return (
                <div key={group.id}>
                  <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                    {group.label}
                  </p>
                  <div className="flex gap-1 lg:flex-col">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const active = isAdminNavActive(pathname, item.href, item.exact);
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
                          <span className="truncate">{item.label}</span>
                          {item.stub ? (
                            <span className="ml-auto hidden text-[9px] font-bold uppercase tracking-wide text-muted lg:inline">
                              Stub
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1 animate-rise">{children}</div>
        </div>
      </div>
    </RoleGate>
  );
}
