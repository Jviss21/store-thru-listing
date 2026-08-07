"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { SparkGranularity } from "@/lib/home-metrics";

/**
 * Labeled sales volume chart for Home.
 * Day / short Custom → hourly bars (8am–8pm); Week / Month → daily bars.
 * Hammoq navy bars with gold highlight on the peak bucket.
 */
export function HomeSalesChart({
  values,
  labels,
  granularity,
  className,
}: {
  values: number[];
  labels: string[];
  granularity: SparkGranularity;
  className?: string;
}) {
  if (!values.length || values.length !== labels.length) return null;

  const max = Math.max(1, ...values);
  const peak = Math.max(...values);
  const title =
    granularity === "hour" ? "Units sold by hour" : "Units sold by day";
  const hint =
    granularity === "hour"
      ? "Business hours · 8am–8pm"
      : "One bar per calendar day";

  // Sparse tick labels so long ranges (month) stay readable
  const labelEvery =
    values.length <= 14 ? 1 : values.length <= 24 ? 2 : Math.ceil(values.length / 12);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[var(--ink-soft)] px-3 py-3 sm:px-4 sm:py-4",
        className
      )}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{hint}</p>
        </div>
        <p className="text-xs tabular-nums text-white/55">
          Peak {formatNumber(peak)}
          {granularity === "hour" ? "/hr" : "/day"}
        </p>
      </div>

      <div
        className="flex h-28 items-end gap-0.5 sm:h-32 sm:gap-1"
        role="img"
        aria-label={`${title}: ${labels.map((l, i) => `${l} ${values[i]}`).join(", ")}`}
      >
        {values.map((v, i) => {
          const pct = Math.max(4, (v / max) * 100);
          const isPeak = v === peak;
          const showLabel = i % labelEvery === 0 || i === values.length - 1;
          return (
            <div
              key={`${labels[i]}-${i}`}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
            >
              <span
                className="pointer-events-none absolute bottom-[calc(100%+4px)] z-10 hidden rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-accent shadow-lg group-hover:block"
                role="tooltip"
              >
                {labels[i]} · {formatNumber(v)}
              </span>
              <div
                className={cn(
                  "w-full max-w-[1.75rem] rounded-t-sm transition",
                  isPeak
                    ? "bg-accent shadow-[0_0_12px_rgba(240,180,41,0.35)]"
                    : "bg-white/25 group-hover:bg-white/40"
                )}
                style={{ height: `${pct}%` }}
                title={`${labels[i]}: ${formatNumber(v)} units`}
              />
              {showLabel ? (
                <span
                  className={cn(
                    "mt-1.5 max-w-full truncate text-center text-[9px] font-medium leading-none sm:text-[10px]",
                    isPeak ? "text-accent" : "text-white/45"
                  )}
                >
                  {labels[i]}
                </span>
              ) : (
                <span className="mt-1.5 h-2.5" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
