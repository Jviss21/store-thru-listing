"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GitBranch, ScanBarcode, ArrowRight } from "lucide-react";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { ItemPipelinePanel } from "@/components/ItemPipelinePanel";
import { useOrg } from "@/components/OrgProvider";
import { getCreatedListings, getCreatedProducts } from "@/lib/demo-actions";
import { products as seedProducts, listings as seedListings } from "@/lib/mock-data";
import {
  WORKFLOW_STAGES,
  buildWorkflowSnapshot,
  listingsForProduct,
  productToWorkflowInput,
  parseStageTag,
  type WorkflowStageId,
} from "@/lib/workflow";
import { RoleGate } from "@/components/RoleGate";
import { SectionEventLog } from "@/components/SectionEventLog";

const ECOM = WORKFLOW_STAGES.filter((s) => s.id !== "retail");

function WorkflowInner() {
  const { org } = useOrg();
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const catalog = useMemo(() => {
    void tick;
    const created = getCreatedProducts();
    const byId = new Map<string, ReturnType<typeof productToWorkflowInput>>();
    for (const p of seedProducts) {
      byId.set(p.id, productToWorkflowInput(p));
    }
    for (const p of created) {
      byId.set(p.id, {
        id: p.id,
        sku: p.sku,
        upc: p.upc,
        status: p.status,
        location: p.location,
        tags: p.tags,
        imageUrls: p.imageUrls,
        strategy: p.strategy,
        listedOn: p.listedOn,
      });
    }
    return Array.from(byId.values());
  }, [tick]);

  const matched = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return null;
    return (
      catalog.find(
        (p) =>
          p.sku.toUpperCase() === q ||
          (p.upc && p.upc.toUpperCase() === q) ||
          p.id.toUpperCase() === q
      ) ?? null
    );
  }, [catalog, query]);

  const snapshot = useMemo(() => {
    if (!matched) return null;
    return buildWorkflowSnapshot(matched, {
      orgId: org.id,
      listings: listingsForProduct(matched.id, seedListings, getCreatedListings()),
    });
  }, [matched, org.id]);

  const stageCounts = useMemo(() => {
    const counts: Partial<Record<WorkflowStageId, number>> = {};
    for (const p of catalog) {
      const snap = buildWorkflowSnapshot(p, {
        orgId: org.id,
        listings: listingsForProduct(p.id, seedListings, getCreatedListings()),
      });
      counts[snap.stage.id] = (counts[snap.stage.id] ?? 0) + 1;
    }
    return counts;
  }, [catalog, org.id]);

  const recentCreated = useMemo(() => {
    void tick;
    return getCreatedProducts().slice(0, 8);
  }, [tick]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-card sm:p-8">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-accent" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 55% at 100% 0%, rgba(240,180,41,0.14), transparent 55%)",
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              Ops · item journey
            </p>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Item pipeline
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Walk one SKU top-to-bottom: intake → donor → putaway → photos/Auto-List → QA → strategy →
            channels → fulfill → ship → sold. Opened from Settings · Item pipeline.
          </p>
          <ol className="mt-3 max-w-xl list-decimal space-y-0.5 pl-4 text-sm text-white/60">
            <li>Scan or enter a SKU / barcode below.</li>
            <li>Review the stage panel and jump to the suggested next action.</li>
            <li>Return to Settings when you are done — this page is not in the main sidebar.</li>
          </ol>
        </div>
      </div>

      <PageHeader
        title="Scan a SKU"
        description="Lookup status and jump to the next stage for any unit in the catalog."
      />

      <Card className="p-5">
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <ScanBarcode className="h-3.5 w-3.5" /> Scan or enter SKU / barcode
          </span>
          <Input
            autoFocus
            className="font-mono text-base"
            placeholder="e.g. TG-4801 or unit barcode"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && matched) {
                window.location.href = `/products/${encodeURIComponent(matched.id)}`;
              }
            }}
          />
        </label>

        {query.trim() && !matched && (
          <p className="mt-3 text-sm text-muted">
            No match. Create a donor batch first, then scan the unit barcode.
          </p>
        )}

        {matched && snapshot && (
          <div className="mt-4 space-y-3">
            <div>
              <p className="font-semibold text-ink">{matched.sku}</p>
              <p className="text-sm text-muted">
                {getCreatedProducts().find((p) => p.id === matched.id)?.title ??
                  seedProducts.find((p) => p.id === matched.id)?.title ??
                  "Product"}
              </p>
            </div>
            <ItemPipelinePanel snapshot={snapshot} sku={matched.sku} />
            <div className="flex flex-wrap gap-2">
              <Link href={`/products/${encodeURIComponent(matched.id)}`}>
                <Button type="button" variant="accent" size="sm">
                  Open product journey <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {snapshot.next && !snapshot.next.href.startsWith("http") && (
                <Link href={snapshot.next.href}>
                  <Button type="button" variant="outline" size="sm">
                    {snapshot.next.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <h2 className="font-semibold text-ink">Stage board</h2>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ECOM.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-ink/8 bg-white/70 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-mono text-xs text-muted">{s.order}.</span> {s.shortLabel}
              </span>
              <Badge tone="neutral">{stageCounts[s.id] ?? 0}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-ink">Recent donor SKUs</h2>
        {recentCreated.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            None yet.{" "}
            <Link href="/manifests/new" className="text-primary hover:underline">
              Create a donor batch
            </Link>{" "}
            to start the pipeline.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/5">
            {recentCreated.map((p) => {
              const stage = parseStageTag(p.tags) ?? "donor";
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div>
                    <Link
                      href={`/products/${encodeURIComponent(p.id)}`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {p.sku}
                    </Link>
                    <p className="text-xs text-muted">{p.title}</p>
                  </div>
                  <Badge tone="blue">{stage}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/manifests/new" className="text-primary hover:underline">
          1. Donor create
        </Link>
        <span className="text-muted">→</span>
        <Link href="/products/scan" className="text-primary hover:underline">
          2. Putaway
        </Link>
        <span className="text-muted">→</span>
        <Link href="/products/auto-list" className="text-primary hover:underline">
          3. Auto-List
        </Link>
        <span className="text-muted">→</span>
        <Link href="/orders/pick-lists" className="text-primary hover:underline">
          4. Pick / pack
        </Link>
        <span className="text-muted">→</span>
        <Link href="/shipments/new" className="text-primary hover:underline">
          5. Ship
        </Link>
      </div>

      <SectionEventLog section="products" title="Event log" />
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <RoleGate path="/workflow">
      <WorkflowInner />
    </RoleGate>
  );
}
