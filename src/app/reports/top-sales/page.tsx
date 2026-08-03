"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import { ReportPageFrame, DataTable, Th, Td } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { REPORT_STAFF, buildTopSales } from "@/lib/report-mock-data";
import { SUPPLIERS } from "@/lib/mock-data";
import { formatDisplayDate } from "@/lib/report-dates";
import { formatCurrency } from "@/lib/utils";

export default function TopSalesPage() {
  const { range, setRange } = useReportRange("last_30");
  const { flash, setFlash } = useFlash();
  const [supplier, setSupplier] = useState("all");
  const [poster, setPoster] = useState("all");

  const rows = useMemo(() => {
    let all = buildTopSales(range.start, range.end);
    if (supplier !== "all") all = all.filter((r) => r.supplier === supplier);
    if (poster !== "all") all = all.filter((r) => r.poster === poster);
    return all.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));
  }, [range, supplier, poster]);

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Top 50 item sales"
        description="Highest sold prices across ShopGoodwill and eBay."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "top-sales",
            rows.map((r) => ({
              rank: r.rank,
              title: r.title,
              poster: r.poster,
              supplier: r.supplier,
              salePrice: r.salePrice,
              channel: r.channel,
              channelId: r.channelId,
              soldAt: r.soldAt,
            })),
            setFlash
          )
        }
        extraFilters={
          <div className="flex flex-wrap gap-3">
            <label className="block min-w-[160px]">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                By supplier
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="all">All suppliers</option>
                {SUPPLIERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-[160px]">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-muted">
                By poster
              </span>
              <select
                className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
              >
                <option value="all">All posters</option>
                {REPORT_STAFF.filter((s) => s.active)
                  .slice(0, 40)
                  .map((s) => (
                    <option key={s.handle} value={s.handle}>
                      {s.handle}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        }
      />

      <DataTable minWidth="980px">
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Poster</Th>
            <Th>Supplier</Th>
            <Th align="right">Sale price</Th>
            <Th>Channel</Th>
            <Th>Date</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="hover:bg-mist/50">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-mist">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="max-w-[320px] truncate font-medium">{r.title}</span>
                </div>
              </Td>
              <Td>{r.poster}</Td>
              <Td>{r.supplier}</Td>
              <Td align="right" className="font-semibold">
                {formatCurrency(r.salePrice)}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{r.channel}</Badge>
                  <span className="font-mono text-xs text-muted">#{r.channelId}</span>
                </div>
              </Td>
              <Td className="text-muted">{formatDisplayDate(r.soldAt.slice(0, 10))}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
