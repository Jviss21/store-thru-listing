"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, ScanBarcode, CheckCircle2, ArrowRight } from "lucide-react";
import { Button, Card, Input, PageHeader, Badge } from "@/components/ui";
import { useOrg } from "@/components/OrgProvider";
import {
  assignPutaway,
  getPutawayByBarcode,
  inventoryLocationsForOrg,
  listPutaways,
  type PutawayRecord,
} from "@/lib/putaway-store";
import { getCreatedProducts } from "@/lib/demo-actions";
import { advanceProductStage } from "@/lib/channel-sim";
import { parseTriage } from "@/lib/workflow";
import { products as seedProducts } from "@/lib/mock-data";
import { logEvent } from "@/lib/event-log";
import { RoleGate } from "@/components/RoleGate";

function PutawayInner() {
  const { org, session } = useOrg();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [barcode, setBarcode] = useState(searchParams.get("barcode") ?? "");
  const [locationId, setLocationId] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<PutawayRecord[]>([]);
  const [locations, setLocations] = useState(() => inventoryLocationsForOrg(org.id));
  const [nextHandoff, setNextHandoff] = useState<{
    productId: string;
    sku: string;
    triage: string;
  } | null>(null);

  useEffect(() => {
    setLocations(inventoryLocationsForOrg(org.id));
    setHistory(listPutaways(org.id));
  }, [org.id]);

  useEffect(() => {
    const fromUrl = searchParams.get("barcode");
    if (fromUrl) setBarcode(fromUrl);
  }, [searchParams]);

  const matchedProduct = useMemo(() => {
    const code = barcode.trim().toUpperCase();
    if (!code) return null;
    const created = getCreatedProducts().find(
      (p) =>
        p.sku.toUpperCase() === code ||
        (p.upc && p.upc.toUpperCase() === code) ||
        (p.tags ?? []).some((t) => t.toUpperCase() === `BARCODE:${code}`)
    );
    if (created) {
      return {
        id: created.id,
        title: created.title,
        sku: created.sku,
        barcode: created.upc || created.sku,
        location: created.location,
      };
    }
    const seed = seedProducts.find(
      (p) => p.sku.toUpperCase() === code || (p.upc && p.upc.toUpperCase() === code)
    );
    if (seed) {
      return {
        id: seed.id,
        title: seed.title,
        sku: seed.sku,
        barcode: seed.upc || seed.sku,
        location: seed.location,
      };
    }
    return null;
  }, [barcode]);

  const existing = barcode.trim() ? getPutawayByBarcode(org.id, barcode) : null;

  async function onAssign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const code = barcode.trim();
    if (!code) {
      setError("Scan or enter a barcode.");
      return;
    }
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) {
      setError("Select an inventory location.");
      return;
    }

    const record = assignPutaway(org.id, {
      barcode: code,
      sku: matchedProduct?.sku || code,
      productId: matchedProduct?.id ?? null,
      locationId: loc.id,
      locationName: loc.name,
      assignedBy: session.handle || session.name,
    });

    try {
      await fetch("/api/inventory/putaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          barcode: record.barcode,
          sku: record.sku,
          productId: record.productId,
          locationId: record.locationId,
          locationName: record.locationName,
        }),
      });
    } catch {
      /* client store is source of truth in demo */
    }

    if (matchedProduct) {
      const { saveCreatedProduct, getCreatedProducts: reload } = await import(
        "@/lib/demo-actions"
      );
      const row = reload().find((p) => p.id === matchedProduct.id);
      if (row) {
        const triage = parseTriage(row.tags);
        saveCreatedProduct({
          ...row,
          location: loc.name,
          upc: row.upc || code,
        });
        const nextStage = triage === "retail" ? "retail" : "photos";
        advanceProductStage(matchedProduct.id, nextStage, {
          location: loc.name,
        });
        setNextHandoff({
          productId: matchedProduct.id,
          sku: matchedProduct.sku,
          triage,
        });
      }
    }

    logEvent({
      section: "products",
      action: "Putaway assigned",
      resource: `${record.barcode} → ${loc.name}`,
      resourceHref: matchedProduct
        ? `/products/${matchedProduct.id}`
        : "/products/putaway",
      orgId: org.id,
      user: session.handle || undefined,
      userName: session.name || undefined,
    });

    setHistory(listPutaways(org.id));
    setFlash(`Assigned ${record.barcode} to ${loc.name}`);
    setBarcode("");
    setLocationId("");
    window.setTimeout(() => setFlash(null), 2800);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-12">
      <PageHeader
        title="Scan / putaway"
        description="Scan a unit barcode from donor create, then assign a shelf from Admin Inventory Locations."
        actions={
          <Link href="/admin/inventory-locations">
            <Button type="button" variant="outline" size="sm">
              <MapPin className="h-4 w-4" /> Manage locations
            </Button>
          </Link>
        }
      />

      {(flash || error) && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-accent/35 bg-accent/10 text-ink"
          }`}
        >
          {error ?? flash}
        </div>
      )}

      {nextHandoff && !error && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-accent/30 bg-accent/10 p-4">
          <div>
            <p className="text-sm font-semibold text-ink">
              Putaway complete · {nextHandoff.sku}
            </p>
            <p className="text-xs text-muted">
              {nextHandoff.triage === "retail"
                ? "Retail triage — out of ecom Auto-List."
                : "Next: photos + InfinityAI Auto-List (ecom path)."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/products/${nextHandoff.productId}`}>
              <Button type="button" variant="outline" size="sm">
                Open product
              </Button>
            </Link>
            {nextHandoff.triage !== "retail" && (
              <Button
                type="button"
                variant="accent"
                size="sm"
                onClick={() =>
                  router.push(
                    `/products/auto-list?sku=${encodeURIComponent(nextHandoff.sku)}`
                  )
                }
              >
                Photos / Auto-List <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <form className="space-y-4" onSubmit={(e) => void onAssign(e)}>
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ScanBarcode className="h-3.5 w-3.5" /> Barcode / SKU
            </span>
            <Input
              autoFocus
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type unit barcode"
              className="font-mono text-base"
            />
          </label>

          {matchedProduct && (
            <div className="rounded-xl border border-ink/10 bg-mist/50 px-4 py-3 text-sm">
              <p className="font-semibold text-ink">{matchedProduct.title}</p>
              <p className="mt-0.5 font-mono text-xs text-muted">
                SKU {matchedProduct.sku}
                {matchedProduct.location ? ` · was ${matchedProduct.location}` : ""}
              </p>
              <Link
                href={`/products/${matchedProduct.id}`}
                className="mt-1 inline-block text-xs text-primary hover:underline"
              >
                Open product
              </Link>
            </div>
          )}

          {existing && !flash && (
            <p className="text-sm text-muted">
              Currently on shelf:{" "}
              <span className="font-semibold text-ink">{existing.locationName}</span>
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Inventory location
            </span>
            <select
              className="h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none focus:border-ink/30 focus:ring-2 focus:ring-accent/40"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
            >
              <option value="">Select location…</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                  {l.controlledInShop ? " (controlled)" : ""}
                </option>
              ))}
            </select>
            {locations.length === 0 && (
              <p className="text-xs text-muted">
                No locations yet.{" "}
                <Link href="/admin/inventory-locations" className="text-primary hover:underline">
                  Add one in Admin
                </Link>
                .
              </p>
            )}
          </label>

          <div className="flex justify-end">
            <Button type="submit" variant="accent" disabled={!locations.length}>
              <CheckCircle2 className="h-4 w-4" /> Assign putaway
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold text-ink">Recent putaways</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No assignments yet for this org.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/5">
            {history.slice(0, 12).map((r) => (
              <li
                key={`${r.barcode}-${r.assignedAt}`}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div>
                  <p className="font-mono font-semibold text-ink">{r.barcode}</p>
                  <p className="text-xs text-muted">
                    {new Date(r.assignedAt).toLocaleString()}
                    {r.sku !== r.barcode ? ` · SKU ${r.sku}` : ""}
                  </p>
                </div>
                <Badge tone="blue">{r.locationName}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function PutawayPage() {
  return (
    <RoleGate path="/products/putaway">
      <Suspense fallback={<div className="p-8 text-sm text-muted">Loading putaway…</div>}>
        <PutawayInner />
      </Suspense>
    </RoleGate>
  );
}
