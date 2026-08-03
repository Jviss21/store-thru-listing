"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";

const DEMO_LISTS = [
  {
    id: "PL-1042",
    profile: "Ready to fulfill · Standard",
    creator: "jdoe",
    items: 28,
    createdAt: "Aug 3, 2026 · 9:14 AM",
    lockedUntil: "Aug 3, 2026 · 11:59 PM",
  },
  {
    id: "PL-1041",
    profile: "Multi-item · Being pulled",
    creator: "jsmith",
    items: 41,
    createdAt: "Aug 2, 2026 · 4:02 PM",
    lockedUntil: "Unlocked",
  },
  {
    id: "PL-1038",
    profile: "Custom",
    creator: "ajones",
    items: 12,
    createdAt: "Aug 1, 2026 · 11:20 AM",
    lockedUntil: "Unlocked",
  },
];

export default function PickListsPage() {
  return (
    <div className="space-y-5">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <PageHeader
        title="Pick lists"
        description="Active and recent pick lists for floor picking (demo stub)."
        actions={
          <Link href="/orders">
            <Button type="button" variant="outline">
              <ClipboardList className="h-4 w-4" /> Orders
            </Button>
          </Link>
        }
      />

      <Card className="overflow-x-auto">
        {DEMO_LISTS.length === 0 ? (
          <EmptyState
            title="No pick lists"
            description="Create a pick list from Orders → More actions."
          />
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-2">Pick list</th>
                <th className="px-3 py-2">Generated from</th>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">Item count</th>
                <th className="px-3 py-2">Created on</th>
                <th className="px-5 py-2">Locked until</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LISTS.map((row) => (
                <tr key={row.id} className="border-b hover:bg-accent/8">
                  <td className="px-5 py-3 font-semibold text-ink">{row.id}</td>
                  <td className="px-3 py-3">{row.profile}</td>
                  <td className="px-3 py-3">{row.creator}</td>
                  <td className="px-3 py-3 tabular-nums">{row.items}</td>
                  <td className="px-3 py-3 text-muted">{row.createdAt}</td>
                  <td className="px-5 py-3 text-muted">{row.lockedUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
