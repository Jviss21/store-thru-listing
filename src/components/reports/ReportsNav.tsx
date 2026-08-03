"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOWNLOAD_REPORTS, IN_APP_REPORTS } from "@/lib/report-catalog";
import { cn } from "@/lib/utils";
import { useOrg } from "@/components/OrgProvider";
import { canViewMasterEventLog } from "@/lib/roles";

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: { href: string; label: string; stub?: boolean }[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/reports/suppliers" && pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/reports/suppliers" && pathname.startsWith("/reports/suppliers"));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition",
                  active
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink/80 hover:bg-ink/5 hover:text-ink"
                )}
              >
                <span className="truncate">{item.label}</span>
                {item.stub && (
                  <span
                    className={cn(
                      "ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                      active ? "bg-accent/30 text-accent" : "bg-mist text-muted"
                    )}
                  >
                    Stub
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReportsNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { session, isOps } = useOrg();
  const showMaster = canViewMasterEventLog(session.role, isOps);
  const inApp = IN_APP_REPORTS.filter(
    (r) => showMaster || r.href !== "/reports/events"
  );

  return (
    <nav
      className={cn(
        "space-y-5 rounded-2xl border border-ink/10 bg-white/80 p-3 shadow-card backdrop-blur",
        className
      )}
    >
      <div className="px-2 pt-1">
        <Link href="/reports" className="font-display text-sm font-bold text-ink hover:text-ink/80">
          All reports
        </Link>
      </div>
      <NavGroup title="In-app reports" items={inApp} pathname={pathname} />
      <NavGroup title="Downloads" items={DOWNLOAD_REPORTS} pathname={pathname} />
    </nav>
  );
}
