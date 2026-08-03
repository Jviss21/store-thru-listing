"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { ReportPageFrame, DataTable, Th, Td } from "@/components/reports/ReportChrome";
import {
  AnalyticalReportHeader,
  downloadReportRows,
  useFlash,
  useReportRange,
} from "@/components/reports/AnalyticalHelpers";
import { buildIntakeItems } from "@/lib/report-mock-data";
import { formatDisplayDate } from "@/lib/report-dates";

export default function SupplierIntakeItemsPage() {
  const { range, setRange } = useReportRange("mtd");
  const { flash, setFlash } = useFlash();
  const rows = useMemo(() => buildIntakeItems(range.start, range.end), [range]);

  return (
    <ReportPageFrame>
      <p className="text-sm text-muted">
        <Link href="/reports/suppliers" className="text-primary hover:underline">
          Suppliers
        </Link>{" "}
        &gt; All intake items
      </p>
      <AnalyticalReportHeader
        title="All intake items"
        description="Manifest / intake line items for the selected range."
        range={range}
        setRange={setRange}
        flash={flash}
        onDownload={() =>
          downloadReportRows(
            "intake-items",
            rows as unknown as Record<string, unknown>[],
            setFlash
          )
        }
      />
      <DataTable minWidth="900px">
        <thead>
          <tr>
            <Th>SKU</Th>
            <Th>Title</Th>
            <Th>Supplier</Th>
            <Th>Status</Th>
            <Th>Accepted by</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.sku}-${r.createdAt}`} className="hover:bg-mist/50">
              <Td mono>{r.sku}</Td>
              <Td className="max-w-[280px] truncate font-medium">{r.title}</Td>
              <Td>{r.supplier}</Td>
              <Td>
                <Badge
                  tone={
                    r.status === "Accepted"
                      ? "green"
                      : r.status === "Rejected"
                        ? "red"
                        : "neutral"
                  }
                >
                  {r.status}
                </Badge>
              </Td>
              <Td>{r.acceptedBy}</Td>
              <Td className="text-muted">{formatDisplayDate(r.createdAt.slice(0, 10))}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </ReportPageFrame>
  );
}
