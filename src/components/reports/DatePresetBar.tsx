"use client";

import {
  DATE_PRESETS,
  formatInclusiveRangeLabel,
  inclusiveDayCount,
  normalizeDateRange,
  type DatePresetId,
  rangeForPreset,
} from "@/lib/report-dates";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";

export function DatePresetBar({
  value,
  onChange,
  className,
}: {
  value: { start: string; end: string; preset?: DatePresetId | "custom" };
  onChange: (next: { start: string; end: string; preset: DatePresetId | "custom" }) => void;
  className?: string;
}) {
  const normalized = normalizeDateRange(value.start, value.end);
  const dayCount = inclusiveDayCount(normalized.start, normalized.end);
  const rangeSummary = formatInclusiveRangeLabel(normalized.start, normalized.end, {
    long: true,
  });

  function setCustom(start: string, end: string) {
    onChange({ ...normalizeDateRange(start, end), preset: "custom" });
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-1.5">
        {DATE_PRESETS.map((p) => {
          const active = value.preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const range = rangeForPreset(p.id);
                onChange({ ...range, preset: p.id });
              }}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                active
                  ? "bg-ink text-white shadow-sm"
                  : "border border-ink/10 bg-white/70 text-ink/70 hover:border-ink/25 hover:text-ink"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[140px] flex-1">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
            From
          </span>
          <Input
            type="date"
            value={normalized.start}
            max={normalized.end}
            onChange={(e) => setCustom(e.target.value, normalized.end)}
          />
        </label>
        <label className="block min-w-[140px] flex-1">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
            To
          </span>
          <Input
            type="date"
            value={normalized.end}
            min={normalized.start}
            onChange={(e) => setCustom(normalized.start, e.target.value)}
          />
        </label>
      </div>
      <p className="text-xs text-muted">
        {rangeSummary}
        {" · "}
        {dayCount === 1 ? "1 calendar day inclusive" : `${dayCount} calendar days inclusive`}
      </p>
    </div>
  );
}
