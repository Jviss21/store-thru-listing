import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import {
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  History,
  Rocket,
  Store,
  Trophy,
  Users,
} from "lucide-react";
import { BRAND, ORG_NAME } from "@/lib/mock-data";

const reports = [
  {
    href: "/reports/productivity",
    title: "Lister Productivity",
    description: `Posts, lists, ${BRAND.autoList}, and sales by teammate.`,
    icon: Users,
  },
  {
    href: "/reports/operational",
    title: "Operational Activity",
    description: `Daily intake → ${BRAND.autoList} → sell → ship.`,
    icon: BarChart3,
  },
  {
    href: "/products/auto-list",
    title: BRAND.autoList,
    description: `${BRAND.ai} channel publish queue with readiness scores.`,
    icon: Rocket,
  },
  {
    href: "/reports/manifests",
    title: "Item Creation Reports",
    description: "Supplier rollups, processed %, cost recovery.",
    icon: ClipboardList,
  },
  {
    href: "/reports/events",
    title: "Event Logs",
    description: `Audit trail including ${BRAND.ai} actions.`,
    icon: History,
  },
  {
    href: "/reports/top-sales",
    title: "Top 50 Sales",
    description: "Highest sold prices across channels.",
    icon: Trophy,
  },
  {
    href: "/reports/suppliers",
    title: "Suppliers",
    description: "Weekly sales and velocity by store/source.",
    icon: Store,
  },
  {
    href: "/reports/generate",
    title: "Generate Reports",
    description: "Download CSV/JSON packs — listings, orders, refunds, AI queues, and more.",
    icon: FileSpreadsheet,
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description={`Operational and financial reporting for ${ORG_NAME}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="h-full p-5 transition hover:border-primary/40">
              <r.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{r.title}</h2>
              <p className="mt-1 text-sm text-muted">{r.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
