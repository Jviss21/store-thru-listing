"use client";

import { useMemo } from "react";
import {
  ReportPageFrame,
  DataTable,
  Th,
  Td,
} from "@/components/reports/ReportChrome";
import { SimpleBarChart } from "@/components/reports/ReportCharts";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import {
  buildManifestAcceptance,
  buildManifestsByUser,
} from "@/lib/report-mock-data";
import { Button } from "@/components/ui";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function ManifestsReportPage() {
  const { range, setRange } = useReportRange("last_30");
  const { flash, setFlash } = useFlash();

  const acceptance = useMemo(
    () => buildManifestAcceptance(range.start, range.end),
    [range]
  );
  const byUser = useMemo(() => buildManifestsByUser(range.start, range.end), [range]);
  const bySupplierBars = useMemo(
    () =>
      acceptance.map((r) => ({
        label: r.supplier,
        value: Math.round(r.totalItems / 20),
      })),
    [acceptance]
  );

  return (
    <ReportPageFrame>
      <AnalyticalReportHeader
        title="Donor Item Creation report"
        about="Supplier rollups for intake acceptance/rejection, sell-thru, revenue, plus donor items by supplier and by user."
        description="Item creation metrics for Test Goodwill."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "donor-intake-acceptance",
            acceptance as unknown as Record<string, unknown>[],
            setFlash
          )
        }
        downloadLabel="Download acceptance"
      />

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">
          Donor Item Creation acceptance / rejection rate
        </h2>
        <DataTable minWidth="1280px">
          <thead>
            <tr>
              <Th>Supplier</Th>
              <Th align="right">Total items</Th>
              <Th align="right">Unprocessed</Th>
              <Th align="right">Processed</Th>
              <Th align="right">Accepted</Th>
              <Th align="right">Rejected</Th>
              <Th align="right">Active listings</Th>
              <Th align="right">Sold</Th>
              <Th align="right">Avg sale</Th>
              <Th align="right">Revenue</Th>
              <Th align="right">Unproc %</Th>
              <Th align="right">Proc %</Th>
              <Th align="right">Accept %</Th>
              <Th align="right">Reject %</Th>
              <Th align="right">Sell-thru %</Th>
            </tr>
          </thead>
          <tbody>
            {acceptance.map((r) => (
              <tr key={r.supplier} className="hover:bg-mist/50">
                <Td className="font-medium">{r.supplier}</Td>
                <Td align="right">{formatNumber(r.totalItems)}</Td>
                <Td align="right">{formatNumber(r.unprocessed)}</Td>
                <Td align="right">{formatNumber(r.processed)}</Td>
                <Td align="right">{formatNumber(r.accepted)}</Td>
                <Td align="right">{formatNumber(r.rejected)}</Td>
                <Td align="right">{formatNumber(r.activeListings)}</Td>
                <Td align="right">{formatNumber(r.sold)}</Td>
                <Td align="right">{formatCurrency(r.avgSalePrice)}</Td>
                <Td align="right">{formatCurrency(r.totalRevenue)}</Td>
                <Td align="right">{r.unprocessedRate}%</Td>
                <Td align="right">{r.processedRate}%</Td>
                <Td align="right">{r.acceptanceRate}%</Td>
                <Td align="right">{r.rejectionRate}%</Td>
                <Td align="right">{r.sellThruRate}%</Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Donor items by supplier</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadReportRows(
                  "donor-items-by-supplier",
                  bySupplierBars.map((r) => ({ supplier: r.label, batchCount: r.value })),
                  setFlash
                )
              }
            >
              Download
            </Button>
          </div>
          <SimpleBarChart rows={bySupplierBars} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Donor items by user</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                downloadReportRows(
                  "donor-items-by-user",
                  byUser.map((r) => ({
                    username: r.username,
                    batchCount: r.manifestCount,
                    itemCount: r.manifestItemCount,
                  })) as unknown as Record<string, unknown>[],
                  setFlash
                )
              }
            >
              Download
            </Button>
          </div>
          <DataTable minWidth="420px">
            <thead>
              <tr>
                <Th>Username</Th>
                <Th align="right">Batch count</Th>
                <Th align="right">Item count</Th>
              </tr>
            </thead>
            <tbody>
              {byUser.map((r) => (
                <tr key={r.username} className="hover:bg-mist/50">
                  <Td className="font-medium">{r.username}</Td>
                  <Td align="right">{formatNumber(r.manifestCount)}</Td>
                  <Td align="right">{formatNumber(r.manifestItemCount)}</Td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      </div>
    </ReportPageFrame>
  );
}
