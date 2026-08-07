import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import {
  AboutCard,
  ReportBreadcrumb,
  ReportPageFrame,
} from "@/components/reports/ReportChrome";
import { ArrowRight, ClipboardList, Store, Users } from "lucide-react";

const LINKS = [
  {
    href: "/reports/suppliers/sales",
    title: "Sales Overview",
    description: "Weekly/period sales, listed, sold, and velocity by supplier.",
    icon: Store,
  },
  {
    href: "/reports/suppliers/intake",
    title: "All intake items",
    description: "Donor intake line items with status and acceptor.",
    icon: ClipboardList,
  },
  {
    href: "/reports/suppliers/activity",
    title: "User activity",
    description: "Actions by user against suppliers in the selected range.",
    icon: Users,
  },
];

export default function SuppliersHubPage() {
  return (
    <ReportPageFrame>
      <ReportBreadcrumb crumbs={[{ label: "Reports", href: "/reports" }, { label: "Suppliers" }]} />
      <PageHeader
        title="Suppliers"
        description="Track inventory from intake through sales."
      />
      <AboutCard>
        Choose a suppliers report below. Each child page has its own date range and CSV download.
      </AboutCard>

      <Card className="overflow-hidden">
        <div className="border-b border-ink/8 bg-ink px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">Reports</p>
          <h2 className="mt-1 font-display text-xl font-bold text-white">Suppliers</h2>
          <p className="mt-1 text-sm text-white/70">
            Track your inventory from start to finish and monitor your sales.
          </p>
        </div>
        <ul className="divide-y divide-ink/8">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="flex items-start gap-3 px-5 py-4 transition hover:bg-mist/60"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-accent">
                  <l.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    {l.title}
                    <ArrowRight className="h-3.5 w-3.5 text-muted" />
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{l.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </ReportPageFrame>
  );
}
