"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, Plus } from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  createPickListFromOpenOrders,
  getPickLists,
  pickListProgress,
  PICK_LISTS_CHANGED,
  type PickList,
} from "@/lib/pick-lists-store";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: PickList["status"]) {
  if (status === "packed") return "green" as const;
  if (status === "picked") return "blue" as const;
  if (status === "picking") return "yellow" as const;
  if (status === "cancelled") return "red" as const;
  return "neutral" as const;
}

export default function PickListsPage() {
  const { org, hydrated } = useOrg();
  const router = useRouter();
  const [lists, setLists] = useState<PickList[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!hydrated) return;
    setLists(getPickLists(org.id));
  }, [hydrated, org.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onChange(e: Event) {
      const detail = (e as CustomEvent).detail as { orgId?: string } | undefined;
      if (detail?.orgId && detail.orgId !== org.id) return;
      refresh();
    }
    window.addEventListener(PICK_LISTS_CHANGED, onChange);
    return () => window.removeEventListener(PICK_LISTS_CHANGED, onChange);
  }, [org.id, refresh]);

  function flashMsg(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  }

  function createList() {
    setBusy(true);
    try {
      const list = createPickListFromOpenOrders({ orgId: org.id });
      flashMsg(`Created ${list.id} · ${list.lines.length} lines`);
      router.push(`/orders/pick-lists/${list.id}`);
    } catch (err) {
      flashMsg(err instanceof Error ? err.message : "Could not create pick list.");
      setBusy(false);
    }
  }

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
        description="Scanner-first pick waves from open orders — group by location, scan SKU/barcode, then pack confirm."
        actions={
          <>
            <Link href="/orders">
              <Button type="button" variant="outline">
                <ClipboardList className="h-4 w-4" /> Orders
              </Button>
            </Link>
            <Button type="button" variant="accent" onClick={createList} disabled={!hydrated || busy}>
              <Plus className="h-4 w-4" /> Create from open orders
            </Button>
          </>
        }
      />

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <Card className="overflow-x-auto">
        {lists.length === 0 ? (
          <EmptyState
            title="No pick lists yet"
            description="Create a pick list from Orders → More actions, or use Create from open orders."
          />
        ) : (
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-2">Pick list</th>
                <th className="px-3 py-2">Profile</th>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-5 py-2">Locked until</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((row) => {
                const prog = pickListProgress(row);
                return (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b hover:bg-accent/8"
                    onClick={() => router.push(`/orders/pick-lists/${row.id}`)}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/orders/pick-lists/${row.id}`}
                        className="font-semibold text-ink hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.id}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{row.profile}</td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{row.createdBy}</span>
                      {row.createdByName && row.createdByName !== row.createdBy ? (
                        <span className="block text-xs text-muted">{row.createdByName}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      {prog.picked}/{prog.total}
                      {prog.notFound > 0 ? (
                        <span className="ml-1 text-xs text-coral">({prog.notFound} missing)</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-muted">{formatWhen(row.createdAt)}</td>
                    <td className="px-5 py-3 text-muted">
                      {row.lockedUntil ? formatWhen(row.lockedUntil) : "Unlocked"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
