"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Printer, Rocket, Settings, Trash2 } from "lucide-react";
import { BarcodeStub, printUnitBarcode } from "@/components/BarcodeStub";
import { InfinityBadge } from "@/components/Brand";
import { RoleGate } from "@/components/RoleGate";
import { useOrg } from "@/components/OrgProvider";
import { Button, Card, Input, Textarea } from "@/components/ui";
import {
  allocateDonorSkuBarcode,
  loadAdminIms,
  peekNextDonorSku,
  type AdminImsState,
} from "@/lib/admin-ims";
import {
  getCreatedProducts,
  saveCreatedManifest,
  saveCreatedProduct,
} from "@/lib/demo-actions";
import { logEvent } from "@/lib/event-log";
import { BRAND, CATEGORY_PATHS, CURRENT_USER, SUPPLIERS } from "@/lib/mock-data";
import { canAccessAdminConsole } from "@/lib/roles";
import type { Manifest } from "@/lib/types";

type Line = {
  id: string;
  title: string;
  sku: string;
  barcode: string;
};

function DonorBatchCreateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { org, session, isOps, hydrated: orgHydrated } = useOrg();
  const canAdmin = canAccessAdminConsole(session.role, isOps);

  const [supplier, setSupplier] = useState(SUPPLIERS[SUPPLIERS.length - 1] ?? "Supplier 12");
  const [batchBarcode, setBatchBarcode] = useState(params.get("barcode") ?? "");
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [ims, setIms] = useState<AdminImsState | null>(null);

  useEffect(() => {
    if (!orgHydrated) return;
    setIms(loadAdminIms(org.id));
  }, [org.id, orgHydrated]);

  function addProduct() {
    if (!title.trim()) return;
    if (!orgHydrated) return;

    const auto = ims?.manifests.autoGenerateSkuOnCreate !== false;
    let sku: string;
    let barcode: string;

    if (auto) {
      const allocated = allocateDonorSkuBarcode(org.id);
      setIms(allocated.state);
      sku = allocated.sku;
      barcode = allocated.barcode;
    } else {
      const existing = new Set([
        ...getCreatedProducts().map((p) => p.sku.toUpperCase()),
        ...lines.map((l) => l.sku.toUpperCase()),
      ]);
      const base = params.get("sku")?.trim() || `MANUAL-${Date.now().toString(36).toUpperCase()}`;
      sku = existing.has(base.toUpperCase()) ? `${base}-${lines.length + 1}` : base;
      barcode = sku;
    }

    const next: Line = {
      id: `tmp-${Date.now()}-${lines.length}`,
      title: title.trim(),
      sku,
      barcode,
    };
    setLines((prev) => [...prev, next]);
    setTitle("");
    setFlash(`Generated SKU ${sku} · barcode ${barcode}`);
    window.setTimeout(() => setFlash(null), 2400);
    logEvent({
      section: "manifests",
      action: "Generated unit SKU/barcode",
      resource: sku,
      resourceHref: "/manifests/new",
      orgId: org.id,
    });

    if (ims?.manifests.printBarcodeOnCreate) {
      printUnitBarcode({
        sku: barcode,
        title: next.title,
        supplier,
        batch: batchBarcode.trim() || undefined,
      });
    }
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function save() {
    const next: string[] = [];
    if (!supplier) next.push("Supplier / donor is required.");
    if (!batchBarcode.trim()) next.push("Batch barcode / donation ID is required.");
    else if (!/^[A-Za-z0-9-]+$/.test(batchBarcode.trim())) {
      next.push("Batch barcode can only contain letters, numbers, and dashes.");
    }
    if (lines.length === 0) next.push("Add at least one product before creating.");
    setErrors(next);
    if (next.length) return;

    setSaving(true);
    const now = new Date().toISOString();
    const code = batchBarcode.trim().toUpperCase();

    // Prefer Postgres SoR when session has orgId and DB is ready
    let dbManifestId: string | null = null;
    try {
      const res = await fetch("/api/manifests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          batchBarcode: code,
          supplier,
          notes: notes.trim() || undefined,
          lines: lines.map((l) => ({
            title: l.title,
            sku: l.sku,
            barcode: l.barcode,
          })),
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { id: string; products?: { id: string; sku: string }[] };
      };
      if (json.ok && json.data?.id) {
        dbManifestId = json.data.id;
      }
    } catch {
      /* fall through to local mock */
    }

    const manifestId = dbManifestId ?? `local-m-${Date.now()}`;

    for (const line of lines) {
      saveCreatedProduct({
        id: dbManifestId ? `db-${line.sku}` : `local-${line.id}`,
        title: line.title,
        sku: line.sku,
        category: "General Merchandise",
        categoryPath: CATEGORY_PATHS["General Merchandise"],
        supplier,
        price: 0,
        location: "Receiving",
        description: `${line.title} — donor intake via ${code}.`,
        privateDescription: line.sku,
        status: "Draft",
        imageNames: [],
        imageUrls: [],
        createdAt: now,
        listedOn: [],
        condition: "Used - Good",
        tags: ["Donor", `batch:${code}`, `barcode:${line.barcode}`],
        upc: line.barcode,
      });
    }

    const manifest: Manifest = {
      id: manifestId,
      code,
      supplier,
      createdBy: session.name || CURRENT_USER.name,
      createdAt: now,
      updatedAt: now,
      status: "Created",
      productCount: lines.length,
      items: lines.map((line, i) => ({
        id: `mi-${manifestId}-${i}`,
        title: line.title,
        sku: line.sku,
        reviewStatus: "Draft product",
      })),
      notes: notes.trim()
        ? [
            {
              id: `note-${Date.now()}`,
              user: session.handle || CURRENT_USER.handle,
              body: notes.trim(),
              at: now,
            },
          ]
        : [],
      events: [
        {
          id: `ev-${Date.now()}`,
          user: session.handle || CURRENT_USER.handle,
          action: `created donor batch ${code} with ${lines.length} unit SKU(s)${
            dbManifestId ? " (postgres)" : ""
          }`,
          at: now,
        },
      ],
    };
    saveCreatedManifest(manifest);
    setSaving(false);
    const firstBarcode = lines[0]?.barcode;
    if (firstBarcode) {
      router.push(`/products/putaway?barcode=${encodeURIComponent(firstBarcode)}`);
    } else {
      router.push(`/manifests/${manifestId}`);
    }
  }

  const nextPreview = ims ? peekNextDonorSku(ims.manifests) : "TG-4801";

  return (
    <div className="space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <div>
          <Link href="/manifests" className="text-primary hover:underline">
            Donor Item Creation
          </Link>{" "}
          &gt; Manual donor create
        </div>
        {canAdmin && (
          <Link
            href="/admin/donor-item-creation"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Settings className="h-3.5 w-3.5" /> Admin SKU & barcode settings
          </Link>
        )}
      </div>

      <Card className="flex flex-wrap items-center gap-3 border-accent/25 bg-accent/[0.06] p-4">
        <InfinityBadge />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Ideal path: {BRAND.autoList} onboarding</p>
          <p className="text-xs text-muted">
            Request a demo for full store→ecomm onboarding. This page is the manual donation-batch
            create with per-unit SKU / barcode generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="https://hammoq.com/contact" target="_blank" rel="noopener noreferrer">
            <Button variant="accent" size="sm" type="button">
              Request a demo
            </Button>
          </a>
          <Link href="/products/auto-list">
            <Button variant="outline" size="sm" type="button">
              <Rocket className="h-3.5 w-3.5" /> Try {BRAND.autoList}
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Create donor batch</h1>
        <p className="mt-1 text-sm text-muted">
          Select supplier, enter a batch / donation ID, then add products. Each unit gets a unique{" "}
          <span className="font-mono text-ink">{nextPreview.replace(/\d+$/, "xxxx")}</span> SKU and
          printable barcode when added
          {ims?.manifests.autoGenerateSkuOnCreate === false
            ? " (auto-generate is off in Admin — enter SKUs manually via URL or defaults)."
            : ` (prefix ${ims?.manifests.skuPrefix ?? "TG"} from Admin defaults).`}
        </p>

        {errors.length > 0 && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <ul className="list-disc pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {flash && (
          <div className="mt-4 rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
            {flash}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">
              Supplier / donor <span className="text-red-600">(required)</span>
            </label>
            <select
              className="mt-1 h-9 w-full rounded-md border px-3 text-sm"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              {SUPPLIERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              Batch barcode / donation ID <span className="text-red-600">(required)</span>
            </label>
            <Input
              className="mt-1"
              value={batchBarcode}
              onChange={(e) => setBatchBarcode(e.target.value)}
              placeholder="e.g. BATCH-1001"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">Products</h2>
            <span className="rounded-full bg-gray-100 px-2 text-xs font-medium">{lines.length}</span>
            {ims?.manifests.autoGenerateSkuOnCreate !== false && (
              <span className="text-xs text-muted">
                Next SKU <span className="font-mono font-semibold text-ink">{nextPreview}</span>
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Red sweater, Lot of records, etc..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addProduct();
                }
              }}
            />
            <Button type="button" onClick={addProduct} disabled={!orgHydrated}>
              Add Product
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="mt-8 rounded-md border border-dashed py-12 text-center text-sm text-muted">
              This item batch is blank. Click &quot;Add product&quot; above — a unique SKU and barcode
              are generated for each unit.
            </div>
          ) : (
            <ul className="mt-4 divide-y rounded-md border">
              {lines.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{line.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      SKU <span className="font-mono font-semibold text-ink">{line.sku}</span>
                      {" · "}
                      Barcode{" "}
                      <span className="font-mono font-semibold text-ink">{line.barcode}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <BarcodeStub
                      compact
                      sku={line.barcode}
                      title={line.title}
                      supplier={supplier}
                      batch={batchBarcode.trim() || undefined}
                    />
                    <Link
                      href={`/products/putaway?barcode=${encodeURIComponent(line.barcode)}`}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-mist"
                    >
                      Putaway
                    </Link>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => removeLine(line.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="success"
              type="button"
              disabled={saving}
              onClick={() => void save()}
            >
              Create Item
            </Button>
            {lines.length > 0 && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  lines.forEach((line, i) => {
                    window.setTimeout(() => {
                      printUnitBarcode({
                        sku: line.barcode,
                        title: line.title,
                        supplier,
                        batch: batchBarcode.trim(),
                      });
                    }, i * 350);
                  });
                  logEvent({
                    section: "manifests",
                    action: "Printed unit barcodes",
                    resource: `${lines.length} labels`,
                    resourceHref: "/manifests/new",
                    orgId: org.id,
                  });
                }}
              >
                <Printer className="h-4 w-4" /> Print all barcodes
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            className="mt-1"
            rows={3}
            placeholder="Optional notes here."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}

export default function NewManifestPage() {
  return (
    <RoleGate path="/manifests/new">
      <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
        <DonorBatchCreateInner />
      </Suspense>
    </RoleGate>
  );
}
