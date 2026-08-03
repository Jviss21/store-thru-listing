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

export function daysInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cur <= last) {
    out.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function inDateRange(iso: string, start: string, end: string) {
  const d = iso.slice(0, 10);
  return d >= start && d <= end;
}

export function formatDisplayDate(ymdStr: string) {
  const d = new Date(`${ymdStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
