"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  ScanBarcode,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  confirmPack,
  getPickList,
  groupLinesByLocation,
  markLineNotFound,
  pickListProgress,
  PICK_LISTS_CHANGED,
  scanPickLine,
  type PickList,
} from "@/lib/pick-lists-store";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PickListDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { org, session, hydrated } = useOrg();
  const [list, setList] = useState<PickList | null>(null);
  const [scan, setScan] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [flashError, setFlashError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    if (!hydrated) return;
    setList(getPickList(org.id, id));
  }, [hydrated, org.id, id]);

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

  useEffect(() => {
    if (list && list.status !== "packed") {
      inputRef.current?.focus();
    }
  }, [list?.id, list?.status]);

  const groups = useMemo(
    () => (list ? groupLinesByLocation(list.lines) : []),
    [list]
  );
  const prog = list ? pickListProgress(list) : null;

  function showFlash(msg: string, error = false) {
    setFlash(msg);
    setFlashError(error);
    setTimeout(() => setFlash(null), 2800);
  }

  function onScan(e?: React.FormEvent) {
    e?.preventDefault();
    if (!list) return;
    const result = scanPickLine(org.id, list.id, scan);
    if (result.ok) {
      setList(result.list);
      setScan("");
      showFlash(result.message);
      inputRef.current?.focus();
    } else {
      showFlash(result.message, true);
      if (result.list) setList(result.list);
    }
  }

  function onNotFound(lineId: string) {
    if (!list) return;
    const next = markLineNotFound(org.id, list.id, lineId);
    if (next) {
      setList(next);
      showFlash("Marked not found.", true);
    }
  }

  function onPack() {
    if (!list) return;
    const result = confirmPack(org.id, list.id);
    if (result.ok) {
      setList(result.list);
      showFlash(result.message);
    } else {
      showFlash(result.message, true);
    }
  }

  if (!hydrated) {
    return <p className="p-6 text-sm text-muted">Loading pick list…</p>;
  }

  if (!list) {
    return (
      <div className="space-y-3 p-6">
        <p className="font-medium">Pick list not found</p>
        <Link href="/orders/pick-lists" className="text-sm text-primary hover:underline">
          Back to pick lists
        </Link>
      </div>
    );
  }

  const packed = list.status === "packed";
  const canPack =
    !packed &&
    prog != null &&
    prog.pending === 0 &&
    prog.picked + prog.notFound === prog.total;

  return (
    <div className="space-y-5">
      <Link
        href="/orders/pick-lists"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All pick lists
      </Link>

      <PageHeader
        title={list.id}
        description={`${list.profile} · ${list.orderIds.length} orders · created by ${list.createdByName || list.createdBy}`}
        actions={
          <Button
            type="button"
            variant="accent"
            disabled={!canPack}
            onClick={onPack}
          >
            <PackageCheck className="h-4 w-4" /> Pack confirm
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <Badge tone={packed ? "green" : "yellow"}>{list.status}</Badge>
        {prog && (
          <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold tabular-nums">
            {prog.picked}/{prog.total} picked
            {prog.notFound > 0 ? ` · ${prog.notFound} missing` : ""}
            {prog.pending > 0 ? ` · ${prog.pending} left` : ""}
          </span>
        )}
        <span className="text-xs text-muted">
          Picker: {session.handle || session.name || "session user"}
        </span>
        {list.packedBy && (
          <span className="text-xs text-muted">
            Packed by {list.packedByName || list.packedBy}
            {list.packedAt ? ` · ${formatWhen(list.packedAt)}` : ""}
          </span>
        )}
      </div>

      {flash && (
        <div
          className={cn(
            "rounded-xl border px-4 py-2 text-sm",
            flashError
              ? "border-coral/35 bg-coral/10 text-ink"
              : "border-accent/35 bg-accent/10 text-ink"
          )}
        >
          {flash}
        </div>
      )}

      {!packed && (
        <Card className="p-4">
          <form onSubmit={onScan} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="text-sm font-semibold">Scan SKU / barcode</label>
              <div className="relative mt-1">
                <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  ref={inputRef}
                  className="pl-9 font-mono"
                  value={scan}
                  onChange={(e) => setScan(e.target.value)}
                  placeholder="Scan or type SKU, barcode, or order #"
                  autoComplete="off"
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                Multi-item orders expand to one line per unit. Lines are sorted by location for a
                floor path.
              </p>
            </div>
            <Button type="submit" variant="primary">
              Mark picked
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {groups.map((group) => (
          <Card key={group.location} className="overflow-hidden">
            <div className="border-b bg-mist/50 px-4 py-2.5">
              <p className="text-sm font-bold text-ink">{group.location}</p>
              <p className="text-xs text-muted">
                {group.lines.length} line{group.lines.length === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="divide-y divide-ink/5">
              {group.lines.map((line) => (
                <li
                  key={line.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-4 py-3 text-sm",
                    line.status === "picked" && "bg-mustard/10",
                    line.status === "not_found" && "bg-coral/5"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-ink">{line.sku}</p>
                    <p className="truncate text-ink">{line.title}</p>
                    <p className="text-xs text-muted">
                      {line.orderNumber}
                      {line.pickedBy
                        ? ` · ${line.status} by ${line.pickedBy}${
                            line.pickedAt ? ` · ${formatWhen(line.pickedAt)}` : ""
                          }`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {line.status === "picked" && (
                      <CheckCircle2 className="h-5 w-5 text-ink" aria-label="Picked" />
                    )}
                    {line.status === "not_found" && (
                      <XCircle className="h-5 w-5 text-coral" aria-label="Not found" />
                    )}
                    {line.status === "pending" && !packed && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onNotFound(line.id)}
                      >
                        Not found
                      </Button>
                    )}
                    <Badge
                      tone={
                        line.status === "picked"
                          ? "green"
                          : line.status === "not_found"
                            ? "red"
                            : "neutral"
                      }
                    >
                      {line.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
