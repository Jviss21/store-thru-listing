"use client";

import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { ReportBreadcrumb, ReportPageFrame } from "@/components/reports/ReportChrome";
import { DOWNLOAD_REPORTS } from "@/lib/report-catalog";
import { ORG_NAME } from "@/lib/mock-data";
import { ArrowRight } from "lucide-react";

export default function DownloadsIndexPage() {
  return (
    <ReportPageFrame>
      <ReportBreadcrumb
        crumbs={[{ label: "Reports", href: "/reports" }, { label: "Downloads" }]}
      />
      <PageHeader
        title="Downloads"
        description={`One report per page for ${ORG_NAME}. Generate CSV with date range, timezone, and email delivery (demo completes instantly).`}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {DOWNLOAD_REPORTS.map((r) => (
          <Link key={r.href} href={r.href} className="group block">
            <Card className="h-full p-4 transition group-hover:border-accent/50">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{r.label}</h3>
                {r.stub ? (
                  <span className="rounded bg-mist px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted">
                    Stub
                  </span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted opacity-0 group-hover:opacity-100" />
                )}
              </div>
              {r.description && (
                <p className="mt-1.5 text-sm text-muted">{r.description}</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </ReportPageFrame>
  );
}
