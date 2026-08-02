"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageHeader } from "@/components/ui";
import { BRAND, ORG_SLUG, eventLogRows } from "@/lib/mock-data";
import { downloadCsv, stamp } from "@/lib/download";
import { relativeTime } from "@/lib/utils";

export default function EventLogsPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-sm text-muted">
        <Link href="/reports" className="text-primary hover:underline">
          Reports
        </Link>{" "}
        &gt; Event Logs
      </div>
      <PageHeader
        title="Event Logs"
        description={`Cross-system audit trail — includes ${BRAND.ai} Auto-Draft / Auto-List events.`}
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              downloadCsv(
                `${ORG_SLUG}-event-logs-${stamp()}.csv`,
                eventLogRows as unknown as Record<string, unknown>[]
              );
              setFlash("Event log CSV downloaded.");
              setTimeout(() => setFlash(null), 2000);
            }}
          >
            Download CSV
          </Button>
        }
      />
      {flash && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal">
          {flash}
        </div>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Entity</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {eventLogRows.map((r, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3 text-muted">{relativeTime(r.at)}</td>
                <td className="px-3 py-3 font-medium">{r.user}</td>
                <td className="px-3 py-3">{r.entity}</td>
                <td className="px-3 py-3">{r.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
