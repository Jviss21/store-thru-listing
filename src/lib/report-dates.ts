export type DatePresetId =
  | "today"
  | "yesterday"
  | "wtd"
  | "mtd"
  | "last_month"
  | "last_30";

export type DatePreset = {
  id: DatePresetId;
  label: string;
};

export const DATE_PRESETS: DatePreset[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "wtd", label: "Week to date" },
  { id: "mtd", label: "Month to date" },
  { id: "last_month", label: "Last month" },
  { id: "last_30", label: "Last 30 days" },
];

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function rangeForPreset(id: DatePresetId, now = new Date()): { start: string; end: string } {
  const today = startOfDay(now);
  const end = ymd(today);

  switch (id) {
    case "today":
      return { start: end, end };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const s = ymd(y);
      return { start: s, end: s };
    }
    case "wtd": {
      const day = today.getDay();
      const mondayOffset = day === 0 ? 6 : day - 1;
      const start = new Date(today);
      start.setDate(start.getDate() - mondayOffset);
      return { start: ymd(start), end };
    }
    case "mtd": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: ymd(start), end };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: ymd(start), end: ymd(last) };
    }
    case "last_30": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: ymd(start), end };
    }
  }
}

/** Inclusive calendar days from start through end (YYYY-MM-DD). */
export function daysInRange(start: string, end: string): string[] {
  const { start: s, end: e } = normalizeDateRange(start, end);
  const out: string[] = [];
  const cur = new Date(`${s}T12:00:00`);
  const last = new Date(`${e}T12:00:00`);
  while (cur <= last) {
    out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Swap if needed so start ≤ end; both ends are inclusive calendar days. */
export function normalizeDateRange(start: string, end: string): { start: string; end: string } {
  if (!start && !end) {
    const today = ymd(startOfDay(new Date()));
    return { start: today, end: today };
  }
  if (!start) return { start: end, end };
  if (!end) return { start, end: start };
  return start <= end ? { start, end } : { start: end, end: start };
}

export function inclusiveDayCount(start: string, end: string): number {
  return daysInRange(start, end).length;
}

export function inDateRange(iso: string, start: string, end: string) {
  const d = iso.slice(0, 10);
  const { start: s, end: e } = normalizeDateRange(start, end);
  return d >= s && d <= e;
}

/** Short calendar day with weekday, e.g. "Wed, Aug 6, 2026". */
export function formatDisplayDate(ymdStr: string) {
  const d = new Date(`${ymdStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Long calendar day with weekday, e.g. "Wednesday, Aug 6, 2026". */
export function formatDisplayDateLong(ymdStr: string) {
  const d = new Date(`${ymdStr}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Inclusive From–To label with weekdays; single day collapses to one date. */
export function formatInclusiveRangeLabel(
  start: string,
  end: string,
  opts?: { long?: boolean }
) {
  const { start: s, end: e } = normalizeDateRange(start, end);
  const fmt = opts?.long ? formatDisplayDateLong : formatDisplayDate;
  if (s === e) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
}

/** Today as YYYY-MM-DD in local time. */
export function todayYmd(now = new Date()) {
  return ymd(startOfDay(now));
}

/** Inclusive trailing N calendar days ending today (N ≥ 1). */
export function trailingDaysRange(days: number, now = new Date()): { start: string; end: string } {
  const endDate = startOfDay(now);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - Math.max(0, days - 1));
  return { start: ymd(startDate), end: ymd(endDate) };
}

/** Month-to-date inclusive through today. */
export function monthToDateRange(now = new Date()): { start: string; end: string } {
  const endDate = startOfDay(now);
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  return { start: ymd(startDate), end: ymd(endDate) };
}
