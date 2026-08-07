"use client";

import { PRODUCTIVITY_METRICS, type ProductivityMetric } from "@/lib/report-mock-data";
import { cn } from "@/lib/utils";

const COLORS: Record<ProductivityMetric, string> = {
  accepted: "#0d1b34",
  rejected: "#c94a2a",
  photographed: "#0f9b94",
  posted: "#c9a032",
  shelved: "#e87a1a",
  purged: "#f0b429",
  picked: "#5a6b82",
  packed: "#162a4a",
  shipped: "#c94a2a",
};

export function MultiSeriesChart({
  series,
  height = 280,
  className,
}: {
  series: { date: string; values: Record<ProductivityMetric, number> }[];
  height?: number;
  className?: string;
}) {
  const width = 900;
  const pad = { t: 16, r: 16, b: 36, l: 44 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(
    1,
    ...series.flatMap((s) => PRODUCTIVITY_METRICS.map((m) => s.values[m] || 0))
  );

  function x(i: number) {
    if (series.length <= 1) return pad.l + innerW / 2;
    return pad.l + (i / (series.length - 1)) * innerW;
  }
  function y(v: number) {
    return pad.t + innerH - (v / max) * innerH;
  }

  const chronological = [...series].reverse();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-2xl border border-ink/8 bg-white/80 p-3 shadow-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[640px]">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = pad.t + innerH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={yy}
                  y2={yy}
                  stroke="rgba(13,27,52,0.08)"
                />
                <text x={pad.l - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="#5a6b82">
                  {Math.round(max * t)}
                </text>
              </g>
            );
          })}
          {PRODUCTIVITY_METRICS.map((m) => {
            const points = chronological
              .map((s, i) => `${x(i)},${y(s.values[m] || 0)}`)
              .join(" ");
            return (
              <polyline
                key={m}
                fill="none"
                stroke={COLORS[m]}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
            );
          })}
          {chronological.map((s, i) => (
            <text
              key={s.date}
              x={x(i)}
              y={height - 10}
              textAnchor="middle"
              fontSize="9"
              fill="#5a6b82"
            >
              {s.date.slice(5)}
            </text>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 px-1">
        {PRODUCTIVITY_METRICS.map((m) => (
          <span key={m} className="inline-flex items-center gap-1.5 text-xs capitalize text-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS[m] }}
              aria-hidden
            />
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BarCompareChart({
  rows,
  className,
}: {
  rows: { poster: string; actual: number; target: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.actual, r.target]));
  const barW = 18;
  const gap = 28;
  const groupW = barW * 2 + 8;
  const pad = { t: 20, r: 16, b: 70, l: 44 };
  const width = Math.max(640, pad.l + pad.r + rows.length * (groupW + gap));
  const height = 320;
  const innerH = height - pad.t - pad.b;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-2xl border border-ink/8 bg-white/80 p-3 shadow-card">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" style={{ minWidth: width }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = pad.t + innerH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={yy}
                  y2={yy}
                  stroke="rgba(13,27,52,0.08)"
                />
                <text x={pad.l - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="#5a6b82">
                  {Math.round(max * t)}
                </text>
              </g>
            );
          })}
          {rows.map((r, i) => {
            const gx = pad.l + i * (groupW + gap);
            const ah = (r.actual / max) * innerH;
            const th = (r.target / max) * innerH;
            return (
              <g key={r.poster}>
                <rect
                  x={gx}
                  y={pad.t + innerH - ah}
                  width={barW}
                  height={ah}
                  rx={3}
                  fill="#0d1b34"
                />
                <rect
                  x={gx + barW + 6}
                  y={pad.t + innerH - th}
                  width={barW}
                  height={th}
                  rx={3}
                  fill="#f0b429"
                />
                <text
                  x={gx + groupW / 2}
                  y={height - 12}
                  textAnchor="end"
                  fontSize="10"
                  fill="#5a6b82"
                  transform={`rotate(-40 ${gx + groupW / 2} ${height - 12})`}
                >
                  {r.poster}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex gap-4 px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink" /> Actuals
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Targets
        </span>
      </div>
    </div>
  );
}

export function SimpleBarChart({
  rows,
  className,
}: {
  rows: { label: string; value: number }[];
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div
      className={cn(
        "space-y-2 rounded-2xl border border-ink/8 bg-white/80 p-4 shadow-card",
        className
      )}
    >
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[120px_1fr_48px] items-center gap-2 text-xs">
          <span className="truncate font-medium text-ink">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ink to-accent"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <span className="text-right tabular-nums text-muted">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
