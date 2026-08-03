"use client";

import Link from "next/link";
import { Card } from "@/components/ui";
import { ReportsNav } from "@/components/reports/ReportsNav";
import { cn } from "@/lib/utils";

export function ReportBreadcrumb({
  crumbs,
}: {
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <div className="text-sm text-muted">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`}>
          {i > 0 && <span className="mx-1.5 text-ink/30">&gt;</span>}
          {c.href ? (
            <Link href={c.href} className="text-primary hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink/70">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function AboutCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-ink/10 bg-gradient-to-r from-ink/[0.04] via-white/60 to-accent/10 px-4 py-3 text-sm text-ink/80">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-accent">
        i
      </span>
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}

export function ReportFlash({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="animate-rise rounded-xl border border-accent/40 bg-accent/15 px-4 py-2.5 text-sm font-medium text-ink shadow-sm">
      {message}
    </div>
  );
}

export function ReportPageFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5 lg:flex-row lg:items-start", className)}>
      <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-56">
        <ReportsNav />
      </aside>
      <div className="min-w-0 flex-1 space-y-5">{children}</div>
    </div>
  );
}

export function FilterCard({
  title,
  children,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-ink/8 bg-ink px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
          {title ?? "Filters"}
        </p>
      </div>
      <div className="space-y-4 p-4">
        {children}
        {actions && <div className="flex flex-wrap items-center gap-2 pt-1">{actions}</div>}
      </div>
    </Card>
  );
}

export function DataTable({
  children,
  minWidth = "900px",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </Card>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "border-b border-ink/10 bg-ink/[0.04] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  mono,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  mono?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-ink/6 px-3 py-2.5",
        align === "right" && "text-right tabular-nums",
        mono && "font-mono text-xs",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TotalsRow({ children }: { children: React.ReactNode }) {
  return <tr className="bg-ink/[0.06] font-semibold text-ink">{children}</tr>;
}
