"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Printer,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { ManifestStatusBadge, ReviewStatusBadge } from "@/components/StatusBadge";
import { REJECT_REASONS, getManifest } from "@/lib/mock-data";
import type { ItemReviewStatus, Manifest, ManifestItem, ManifestStatus } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

const TRACKING: ManifestStatus[] = [
  "Created",
  "Ready for Pickup",
  "In Transit",
  "Received",
  "Missing",
];

export default function ManifestDetailPage() {
  const params = useParams<{ id: string }>();
  const seed = getManifest(params.id);
  const [manifest, setManifest] = useState<Manifest | null>(
    seed ? structuredClone(seed) : null
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ManifestStatus>(
    seed?.status ?? "Created"
  );
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [sortByStatus, setSortByStatus] = useState(false);
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    if (!manifest) return [];
    const list = [...manifest.items];
    if (sortByStatus) {
      list.sort((a, b) => a.reviewStatus.localeCompare(b.reviewStatus));
    }
    return list;
  }, [manifest, sortByStatus]);

  if (!manifest) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium">Item batch not found</p>
        <Link href="/manifests" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to item creation
        </Link>
      </Card>
    );
  }

  function setItemStatus(id: string, reviewStatus: ItemReviewStatus, rejectReason?: string) {
    setManifest((m) => {
      if (!m) return m;
      return {
        ...m,
        items: m.items.map((it) =>
          it.id === id ? { ...it, reviewStatus, rejectReason } : it
        ),
        events: [
          {
            id: `ev-${Date.now()}`,
            user: "jdoe",
            action: `marked '${m.items.find((i) => i.id === id)?.title}' as ${reviewStatus}${
              rejectReason ? ` (${rejectReason})` : ""
            }`,
            at: new Date().toISOString(),
          },
          ...m.events,
        ],
        status: "Partially Processed",
        updatedAt: new Date().toISOString(),
      };
    });
  }

  function bulk(status: ItemReviewStatus) {
    selected.forEach((id) => setItemStatus(id, status));
    setSelected([]);
  }

  function addNote() {
    if (!note.trim()) return;
    setManifest((m) => {
      if (!m) return m;
      return {
        ...m,
        notes: [
          {
            id: `note-${Date.now()}`,
            user: "jdoe",
            body: note.trim(),
            at: new Date().toISOString(),
          },
          ...m.notes,
        ],
      };
    });
    setNote("");
  }

  function applyStatus() {
    setManifest((m) => {
      if (!m) return m;
      return {
        ...m,
        status: pendingStatus,
        events: [
          {
            id: `ev-${Date.now()}`,
            user: "jdoe",
            action: `marked this item batch as ${pendingStatus.toLowerCase()}`,
            at: new Date().toISOString(),
          },
          ...m.events,
        ],
        updatedAt: new Date().toISOString(),
      };
    });
    setStatusOpen(false);
  }

  function confirmReject() {
    if (!rejectFor || !rejectReason) return;
    setItemStatus(rejectFor, "Rejected", rejectReason);
    setRejectFor(null);
    setRejectReason("");
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted">
        <Link href="/manifests" className="text-primary hover:underline">
          Item Creation
        </Link>{" "}
        &gt; View Item Batch
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="flex-1"
          placeholder="Search for another item batch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              window.location.href = `/manifests/${encodeURIComponent(search.trim())}`;
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => search.trim() && (window.location.href = `/manifests/${encodeURIComponent(search.trim())}`)}
        >
          Search
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{manifest.code}</h1>
              <ManifestStatusBadge status={manifest.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              Created on {new Date(manifest.createdAt).toLocaleString()} by {manifest.createdBy} · Sent by{" "}
              {manifest.supplier}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" type="button">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => setStatusOpen(true)}>
              Update status
            </Button>
            <Button variant="outline" size="sm" type="button">
              <Printer className="h-3.5 w-3.5" /> Print sheet
            </Button>
            <Button variant="outline" size="sm" type="button">
              <Printer className="h-3.5 w-3.5" /> Print barcode
            </Button>
            <Button variant="outline" size="sm" type="button">
              More <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-medium">Products</h2>
              <span className="rounded-full bg-gray-100 px-2 text-xs">{manifest.items.length}</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={sortByStatus}
                onChange={(e) => setSortByStatus(e.target.checked)}
              />
              Sort by status
            </label>
          </div>

          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm">
              <span>{selected.length} selected</span>
              <Button size="sm" variant="success" type="button" onClick={() => bulk("Accepted")}>
                Accept
              </Button>
              <Button size="sm" variant="danger" type="button" onClick={() => selected[0] && setRejectFor(selected[0])}>
                Reject
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => bulk("On hold")}>
                Place hold
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={() => bulk("Missing")}>
                Missing
              </Button>
              <Button size="sm" variant="outline" type="button">
                Divide
              </Button>
              <Button size="sm" variant="outline" type="button">
                Print barcodes
              </Button>
            </div>
          )}

          <ul className="mt-3 divide-y rounded-md border">
            {items.map((item: ManifestItem) => (
              <li
                key={item.id}
                className={`flex flex-wrap items-center gap-3 px-3 py-3 ${
                  selected.includes(item.id) ? "bg-blue-50" : "bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() =>
                    setSelected((prev) =>
                      prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted">
                    {item.reviewStatus}
                    {item.rejectReason ? ` · ${item.rejectReason}` : ""} · {item.sku}
                  </p>
                </div>
                <ReviewStatusBadge status={item.reviewStatus} />
                <div className="flex items-center gap-1">
                  <button
                    className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                    title="Accept"
                    onClick={() => setItemStatus(item.id, "Accepted")}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded p-1.5 text-red-600 hover:bg-red-50"
                    title="Reject"
                    onClick={() => setRejectFor(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1.5 text-gray-500 hover:bg-gray-50" title="Comment">
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1.5 text-gray-500 hover:bg-gray-50" title="Print">
                    <Printer className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/products/new?title=${encodeURIComponent(item.title)}&sku=${encodeURIComponent(item.sku)}`}
                    className="ml-1 text-xs text-primary hover:underline"
                  >
                    Create product
                  </Link>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-muted">No products on this item batch yet.</li>
            )}
          </ul>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-medium">Notes</h2>
          <ul className="mt-3 space-y-3">
            {manifest.notes.map((n) => (
              <li key={n.id} className="rounded-md bg-gray-50 p-3 text-sm">
                <p className="font-medium">
                  {n.user}{" "}
                  <span className="font-normal text-muted">
                    · {new Date(n.at).toLocaleDateString()}
                  </span>
                </p>
                <p className="mt-1">{n.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <p className="text-sm font-medium">Add note</p>
            <Textarea
              className="mt-1"
              rows={3}
              placeholder="Leave a note."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button className="mt-2" variant="success" type="button" onClick={addNote}>
              Add note
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-medium">Events</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
            {manifest.events.map((ev, idx) => (
              <li key={ev.id} className="relative text-sm">
                <span
                  className={`absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full ${
                    idx === 0 ? "bg-primary" : "bg-gray-300"
                  }`}
                />
                <p>
                  <span className="font-medium">{ev.user}</span> {ev.action}
                </p>
                <p className="text-xs text-muted">{relativeTime(ev.at)}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Update tracking status</h3>
              <button onClick={() => setStatusOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted">Choose a new status for this item batch:</p>
            <div className="mt-4 space-y-2">
              {TRACKING.map((s) => (
                <label key={s} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    checked={pendingStatus === s}
                    onChange={() => setPendingStatus(s)}
                  />
                  <ManifestStatusBadge status={s} />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setStatusOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={applyStatus}>
                Update
              </Button>
            </div>
          </Card>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm p-5">
            <h3 className="font-semibold">Reject reason</h3>
            <select
              className="mt-3 h-9 w-full rounded-md border px-3 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            >
              <option value="">Create or select</option>
              {REJECT_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setRejectFor(null)}>
                Cancel
              </Button>
              <Button variant="danger" type="button" onClick={confirmReject} disabled={!rejectReason}>
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
