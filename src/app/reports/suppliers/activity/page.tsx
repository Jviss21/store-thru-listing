"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ReportPageFrame, DataTable, Th, Td } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { buildSupplierUserActivity } from "@/lib/report-mock-data";
import { formatDisplayDate } from "@/lib/report-dates";
import { formatNumber } from "@/lib/utils";

export default function SupplierUserActivityPage() {
  const { range, setRange } = useReportRange("mtd");
  const { flash, setFlash } = useFlash();
  const rows = useMemo(() => buildSupplierUserActivity(range.start, range.end), [range]);

  return (
    <ReportPageFrame>
      <p className="text-sm text-muted">
        <Link href="/reports/suppliers" className="text-primary hover:underline">
          Suppliers
        </Link>{" "}
        &gt; User activity
      </p>
      <AnalyticalReportHeader
        title="User activity"
        description="Supplier-facing actions by teammate."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "supplier-user-activity",
            rows as unknown as Record<string, unknown>[],
            setFlash
          )
        }
      />
      <DataTable minWidth="700px">
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Supplier</Th>
            <Th align="right">Actions</Th>
            <Th>Last action</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.user}-${r.supplier}-${i}`} className="hover:bg-mist/50">
              <Td className="font-medium">{r.user}</Td>
              <Td>{r.supplier}</Td>
              <Td align="right">{formatNumber(r.actions)}</Td>
              <Td className="text-muted">{formatDisplayDate(r.lastAction)}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
