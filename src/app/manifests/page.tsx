"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { ManifestStatusBadge } from "@/components/StatusBadge";
import { CATEGORIES, manifests as seedManifests } from "@/lib/mock-data";
import type { Manifest, ManifestStatus } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { exportManifestsCsv } from "@/lib/demo-actions";

const STATUSES: ManifestStatus[] = [
  "Created",
  "Ready for Pickup",
  "In Transit",
  "Received",
  "Partially Processed",
  "Processed",
  "Missing",
];

export default function ManifestsPage() {
  const [rows, setRows] = useState<Manifest[]>(seedManifests);
  const [lookup, setLookup] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((m) => {
      if (lookup && !m.code.toLowerCase().includes(lookup.toLowerCase())) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterSupplier && m.supplier !== filterSupplier) return false;
      return true;
    });
  }, [rows, lookup, filterStatus, filterSupplier]);

  const suppliers = Array.from(new Set(rows.map((m) => m.supplier)));

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((m) => m.id) : []);
  }

  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function changeStatus(status: ManifestStatus) {
    setRows((prev) =>
      prev.map((m) => (selected.includes(m.id) ? { ...m, status, updatedAt: new Date().toISOString() } : m))
    );
    setSelected([]);
  }

  function deleteSelected() {
    setRows((prev) => prev.filter((m) => !selected.includes(m.id)));
    setSelected([]);
    setConfirmDelete(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Item Creation"
        description="Intake batches from store floor to reviewed products — create, receive, accept, list."
        actions={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => exportManifestsCsv()}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link href="/manifests/new">
              <Button variant="accent" type="button">
                Create Item
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open batches", value: formatNumber(rows.filter((r) => r.status !== "Processed").length) },
          { label: "In review", value: formatNumber(rows.filter((r) => r.status === "Partially Processed").length) },
          { label: "Ready to create", value: formatNumber(rows.filter((r) => r.status === "Created" || r.status === "Received").length) },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{stat.label}</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold">Search</h2>
          <label className="mt-3 block text-xs text-muted">Lookup item batch</label>
          <div className="mt-1 flex gap-2">
            <Input
              placeholder="Barcode ID"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                const hit = rows.find((m) => m.code.toLowerCase() === lookup.toLowerCase());
                if (hit) window.location.href = `/manifests/${hit.id}`;
              }}
            >
              Go
            </Button>
          </div>
          <Link href="/manifests" className="mt-2 inline-block text-sm text-primary hover:underline">
            Search intake items
          </Link>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold">Item preferences</h2>
          <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <li key={cat} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{cat}</span>
                <Button size="sm" variant="success" type="button">
                  Send
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-primary">Manage preferences</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          {selected.length > 0 ? (
            <>
              <span className="text-sm text-muted">{selected.length} selected</span>
              <select
                className="h-8 rounded-md border px-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) changeStatus(e.target.value as ManifestStatus);
                }}
              >
                <option value="">Change status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" type="button">
                Print Scan Form
              </Button>
              <Button size="sm" variant="danger" type="button" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted">{formatNumber(filtered.length)} results</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b bg-mist/60 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="px-3 py-2">Item batch</th>
                <th className="px-3 py-2"># Products</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Created By</th>
                <th className="px-3 py-2">Created At</th>
                <th className="px-3 py-2">Updated At</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
              <tr className="border-b bg-white">
                <th />
                <th className="px-3 py-2">
                  <Input
                    placeholder="Filter..."
                    value={lookup}
                    onChange={(e) => setLookup(e.target.value)}
                    className="h-8"
                  />
                </th>
                <th />
                <th className="px-3 py-2">
                  <select
                    className="h-8 w-full rounded-md border px-2 text-xs"
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                  >
                    <option value="">All</option>
                    {suppliers.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </th>
                <th />
                <th />
                <th />
                <th className="px-3 py-2">
                  <select
                    className="h-8 w-full rounded-md border px-2 text-xs"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b hover:bg-blue-50/40">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggleOne(m.id)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/manifests/${m.id}`} className="font-medium text-primary hover:underline">
                      {m.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{m.productCount}</td>
                  <td className="px-3 py-3">{m.supplier}</td>
                  <td className="px-3 py-3">{m.createdBy}</td>
                  <td className="px-3 py-3 text-muted">
                    {new Date(m.createdAt).toLocaleString([], {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {new Date(m.updatedAt).toLocaleString([], {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-3">
                    <ManifestStatusBadge status={m.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <Link href={`/manifests/${m.id}`} className="rounded p-1.5 hover:bg-gray-100" title="View">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Link>
                      <button
                        className="rounded p-1.5 hover:bg-gray-100"
                        title="Delete"
                        onClick={() => {
                          setSelected([m.id]);
                          setConfirmDelete(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm p-6 text-center">
            <Trash2 className="mx-auto h-10 w-10 text-red-500" />
            <p className="mt-3 font-medium">Are you sure? This action cannot be undone.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" type="button" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" type="button" onClick={deleteSelected}>
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
