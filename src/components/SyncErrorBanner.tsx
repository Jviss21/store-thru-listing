"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { SyncError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function SyncErrorBanner({
  errors,
  channel,
  className,
}: {
  errors: SyncError[];
  channel?: string;
  className?: string;
}) {
  const filtered = channel
    ? errors.filter((e) => e.channel === channel || e.channel === "System")
    : errors;
  if (!filtered.length) return null;

  const top = filtered.slice(0, 3);
  const qaHref =
    channel === "eBay"
      ? "/listings/ebay?status=Additional%20QA%20Required"
      : channel === "ShopGoodwill"
        ? "/listings/shopgoodwill?status=Additional%20QA%20Required"
        : "/listings/shopgoodwill?status=Additional%20QA%20Required";

  return (
    <div
      className={cn(
        "rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-ink",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {filtered.length} sync error{filtered.length === 1 ? "" : "s"}
            {channel ? ` · ${channel}` : ""}
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-ink/80">
            {top.map((e) => (
              <li key={e.id} className="truncate">
                <span className="font-mono text-[11px] text-muted">{e.sku}</span>
                {" — "}
                {e.message}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            <Link href={qaHref} className="text-coral hover:underline">
              Open Additional QA Required
            </Link>
            <Link href="/settings/connections" className="inline-flex items-center gap-1 text-ink/70 hover:text-ink">
              <RefreshCw className="h-3 w-3" />
              Marketplace connections
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QaRequiredCallout({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  if (count <= 0) return null;
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-brand-orange/30 bg-brand-orange/10 px-4 py-3 text-sm transition hover:bg-brand-orange/15"
    >
      <span className="font-semibold text-ink">
        {count} listing{count === 1 ? "" : "s"} in Additional QA Required
      </span>
      <span className="text-xs font-semibold text-brand-orange">Review →</span>
    </Link>
  );
}
