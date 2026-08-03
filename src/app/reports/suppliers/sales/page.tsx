"use client";

import { useMemo } from "react";
import { ReportPageFrame, DataTable, Th, Td } from "@/components/reports/ReportChrome";
import { Sparkline } from "@/components/Sparkline";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { buildSupplierSalesOverview } from "@/lib/report-mock-data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

export default function SupplierSalesOverviewPage() {
  const { range, setRange } = useReportRange("last_30");
  const { flash, setFlash } = useFlash();
  const rows = useMemo(() => buildSupplierSalesOverview(range.start, range.end), [range]);

  return (
    <ReportPageFrame>
      <p className="text-sm text-muted">
        <Link href="/reports/suppliers" className="text-primary hover:underline">
          Suppliers
        </Link>{" "}
        &gt; Sales Overview
      </p>
      <AnalyticalReportHeader
        title="Sales Overview"
        description="Supplier sales performance for the selected period."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "supplier-sales-overview",
            rows.map((r) => ({
              name: r.name,
              amount: r.amount,
              itemsListed: r.itemsListed,
              itemsSold: r.itemsSold,
              avgDaysToSell: r.avgDaysToSell,
            })),
            setFlash
          )
        }
      />
      <DataTable minWidth="800px">
        <thead>
          <tr>
            <Th>Supplier</Th>
            <Th align="right">Sales</Th>
            <Th align="right">Listed</Th>
            <Th align="right">Sold</Th>
            <Th align="right">Avg days to sell</Th>
            <Th>Trend</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-mist/50">
              <Td className="font-medium">{r.name}</Td>
              <Td align="right">{formatCurrency(r.amount)}</Td>
              <Td align="right">{formatNumber(r.itemsListed)}</Td>
              <Td align="right">{formatNumber(r.itemsSold)}</Td>
              <Td align="right">{r.avgDaysToSell}</Td>
              <Td>
                <Sparkline values={r.spark} />
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
