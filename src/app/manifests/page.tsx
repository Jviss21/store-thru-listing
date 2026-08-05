"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, Download, Eye, Rocket, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { ManifestStatusBadge } from "@/components/StatusBadge";
import { InfinityBadge } from "@/components/Brand";
import { useOrg } from "@/components/OrgProvider";
import { BRAND, CATEGORIES, INFINITY_AI_UPLOAD_HREF, manifests as seedManifests } from "@/lib/mock-data";
import type { Manifest, ManifestStatus } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { exportManifestsCsv } from "@/lib/demo-actions";
import { SectionEventLog } from "@/components/SectionEventLog";
import { RoleGate } from "@/components/RoleGate";
import { logEvent } from "@/lib/event-log";
import { canAccessNav } from "@/lib/roles";

const STATUSES: ManifestStatus[] = [
  "Created",
  "Ready for Pickup",
  "In Transit",
  "Received",
  "Partially Processed",
  "Processed",
  "Missing",
];

function ManifestsInner() {
  const { session, isOps } = useOrg();
  const canAutoList = canAccessNav("auto-list", session.role, isOps);
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
        title="Donor Item Creation"
        description={`${BRAND.autoList} via ${BRAND.ai} is the ideal path for store donations and supplier intake — upload products there, or create donor items manually.`}
        actions={
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              exportManifestsCsv();
              logEvent({
                section: "manifests",
                action: "Exported manifests CSV",
                resource: "Manifests export",
                resourceHref: "/manifests",
              });
            }}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div
        className={cn(
          "grid gap-4",
          canAutoList ? "lg:grid-cols-2" : "lg:grid-cols-1"
        )}
      >
        {canAutoList && (
          <Link
            href={INFINITY_AI_UPLOAD_HREF}
            className="group block rounded-2xl bg-ink p-5 text-white shadow-card transition hover:-translate-y-0.5 hover:bg-ink/95"
            onClick={() =>
              logEvent({
                section: "manifests",
                action: "Opened Infinity AI upload from Donor Item Creation",
                resource: BRAND.ai,
                resourceHref: INFINITY_AI_UPLOAD_HREF,
              })
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-ink">
                <Rocket className="h-5 w-5" />
              </div>
              <InfinityBadge />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Primary · {BRAND.autoList}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">
              Upload in {BRAND.ai}
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/70">
              Push donor and supplier products through {BRAND.ai} {BRAND.autoList} — the ideal
              store→ecomm workflow for intake.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent group-hover:underline">
              Open {BRAND.ai} →
            </span>
          </Link>
        )}

        <Link
          href="/manifests/new"
          className="group block rounded-2xl border border-ink/10 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-ink/20"
          onClick={() =>
            logEvent({
              section: "manifests",
              action: "Opened Manual donor create from Donor Item Creation",
              resource: "Manual donor create",
              resourceHref: "/manifests/new",
            })
          }
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-ink">
            <ClipboardList className="h-5 w-5" />
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">
            Tertiary · full form
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Manual donor create
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Enter photos, title, description, category, condition, brand, price, quantity, and
            shipping for donation/supplier batches — then list to eBay or ShopGoodwill.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange group-hover:underline">
            Manual donor create →
          </span>
        </Link>
      </div>

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
          <h2 className="text-sm font-semibold">Search batches</h2>
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
            <span className="text-sm text-muted">{formatNumber(filtered.length)} intake batches</span>
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

      <SectionEventLog section="manifests" />
    </div>
  );
}

export default function ManifestsPage() {
  return (
    <RoleGate path="/manifests">
      <ManifestsInner />
    </RoleGate>
  );
}
