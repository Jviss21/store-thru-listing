"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui";
import {
  ReportPageFrame,
  DataTable,
  Th,
  Td,
  TotalsRow,
} from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { buildSalesByCategory } from "@/lib/report-mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function SalesByCategoryPage() {
  const { range, setRange } = useReportRange("last_30");
  const { flash, setFlash } = useFlash();
  const [channel, setChannel] = useState("all");
  const [includeBranch, setIncludeBranch] = useState(true);
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let all = buildSalesByCategory(range.start, range.end);
    if (!includeBranch) {
      all = all.filter((r) => !r.category.includes(" > "));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      all = all.filter((r) => r.category.toLowerCase().includes(q));
    }
    // channel filter is visual-only on mock (same data)
    void channel;
    return all;
  }, [range, includeBranch, query, channel]);

  const totals = useMemo(
    () => ({
      sales: rows.reduce((s, r) => s + r.totalSales, 0),
      items: rows.reduce((s, r) => s + r.itemsSold, 0),
    }),
    [rows]
  );

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Sales by category"
        about="Sales grouped by product category with items sold and average price per item (PPI). Uncheck “Include total from branch categories” to show only top-level categories."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "sales-by-category",
            rows as unknown as Record<string, unknown>[],
            setFlash
          )
        }
        extraFilters={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="block min-w-[160px]">
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                  Channels
                </span>
                <select
                  className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="ShopGoodwill">ShopGoodwill</option>
                  <option value="eBay">eBay</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink/20 accent-accent"
                  checked={includeBranch}
                  onChange={(e) => setIncludeBranch(e.target.checked)}
                />
                Include total from branch categories
              </label>
            </div>
            <Input
              placeholder="Search category keywords to filter results"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      />

      <DataTable minWidth="720px">
        <thead>
          <tr>
            <Th>Category</Th>
            <Th align="right">Total sales</Th>
            <Th align="right">Items sold</Th>
            <Th align="right">Avg PPI</Th>
          </tr>
        </thead>
        <tbody>
          <TotalsRow>
            <Td>Totals</Td>
            <Td align="right">{formatCurrency(totals.sales)}</Td>
            <Td align="right">{formatNumber(totals.items)}</Td>
            <Td align="right">
              {totals.items
                ? formatCurrency(Math.round((totals.sales / totals.items) * 100) / 100)
                : "—"}
            </Td>
          </TotalsRow>
          {rows.map((r) => (
            <tr key={r.category} className="hover:bg-mist/50">
              <Td className="font-medium">{r.category}</Td>
              <Td align="right">{formatCurrency(r.totalSales)}</Td>
              <Td align="right">{formatNumber(r.itemsSold)}</Td>
              <Td align="right">{formatCurrency(r.avgPpi)}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
