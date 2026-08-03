import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ReportPageFrame } from "@/components/reports/ReportChrome";
import { DOWNLOAD_REPORTS, IN_APP_REPORTS } from "@/lib/report-catalog";
import { ORG_NAME } from "@/lib/mock-data";
import { ArrowRight, Download, LayoutDashboard } from "lucide-react";

function ReportGroup({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof LayoutDashboard;
  items: { href: string; label: string; description?: string; stub?: boolean }[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <Link key={r.href} href={r.href} className="group block">
            <Card className="h-full p-4 transition group-hover:border-accent/50 group-hover:shadow-glow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{r.label}</h3>
                {r.stub ? (
                  <span className="rounded bg-mist px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted">
                    Stub
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
                )}
              </div>
              {r.description && (
                <p className="mt-1.5 text-sm leading-snug text-muted">{r.description}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function ReportsIndexPage() {
  return (
    <ReportPageFrame>
      <PageHeader
        title="Reports"
        description={`Upright-style reporting for ${ORG_NAME} — one screen per report, navy/gold Hammoq branding.`}
      />
      <ReportGroup title="In-app reports" icon={LayoutDashboard} items={IN_APP_REPORTS} />
      <ReportGroup title="Downloads" icon={Download} items={DOWNLOAD_REPORTS} />
    </ReportPageFrame>
  );
}
