"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Download, Rocket, Upload } from "lucide-react";
import {
  ListingEditorForm,
  emptyFormState,
  validateListingForm,
  type ListingFormState,
} from "@/components/ListingEditorForm";
import {
  SaveButton,
  SaveConfirmBar,
  SaveToast,
  useSaveFeedback,
} from "@/components/SaveFeedback";
import { Button, Card, Input } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { RoleGate } from "@/components/RoleGate";
import { exportListingPacket, saveCreatedListing, saveCreatedProduct } from "@/lib/demo-actions";
import { getEbayAspectsClient } from "@/lib/api/ebay-aspects";
import { logEvent } from "@/lib/event-log";
import { BRAND, CATEGORY_PATHS, INFINITY_AI_UPLOAD_HREF } from "@/lib/mock-data";

function ManualCreateInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [batchBarcode, setBatchBarcode] = useState(params.get("barcode") ?? "");
  const [notes, setNotes] = useState("");
  const [form, setForm] = useState<ListingFormState>(() => {
    const base = emptyFormState();
    return {
      ...base,
      title: params.get("title") ?? "",
      sku: params.get("sku") ?? base.sku,
      channels: [],
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { feedback, justSaved, announce } = useSaveFeedback();

  async function buildAndSave(status: "Draft" | "Active") {
    if (!form.title.trim() || !form.sku.trim()) {
      setError("Title and SKU are required.");
      return null;
    }
    if (batchBarcode.trim() && !/^[A-Za-z0-9-]+$/.test(batchBarcode.trim())) {
      setError("Batch barcode can only contain letters, numbers, and dashes.");
      return null;
    }
    if (status === "Active" && form.channels.length === 0) {
      setError("Add at least one channel (eBay or ShopGoodwill) before listing online.");
      return null;
    }
    if (status === "Active" && form.imageUrls.length === 0) {
      setError("Add at least one photo before listing online.");
      return null;
    }
    if (status === "Active" && form.channels.includes("eBay")) {
      const aspectsRes = await getEbayAspectsClient().getEbayCategoryAspects(form.ebayCategoryId);
      const aspects = aspectsRes.ok ? aspectsRes.data.aspects : [];
      const err = validateListingForm(form, aspects);
      if (err) {
        setError(err);
        return null;
      }
    } else if (status === "Active") {
      const err = validateListingForm(form, []);
      if (err) {
        setError(err);
        return null;
      }
    }
    setError(null);
    const tags = [...form.tags];
    if (batchBarcode.trim()) tags.push(`batch:${batchBarcode.trim()}`);
    if (notes.trim()) tags.push("manual-notes");
    return saveCreatedProduct({
      id: `local-${Date.now()}`,
      title: form.title.trim(),
      sku: form.sku.trim(),
      category: form.category,
      categoryPath: CATEGORY_PATHS[form.category] ?? form.categoryPath,
      supplier: form.supplier,
      price: Number(form.price) || Number(form.startingPrice) || 0,
      location: form.location,
      description: form.description,
      privateDescription: form.privateDescription || form.sku.trim(),
      status,
      imageNames: form.imageUrls.map((_, i) => `photo-${i + 1}.jpg`),
      imageUrls: form.imageUrls,
      createdAt: new Date().toISOString(),
      listedOn: [],
      condition: form.condition,
      brand: form.brand || form.itemSpecifics.Brand,
      carrier: form.carrier,
      strategy: form.strategy,
      tags: tags.length ? tags : ["Demo", "Manual"],
      weightLbs: Number(form.weightLbs) || undefined,
      lengthIn: Number(form.lengthIn) || undefined,
      widthIn: Number(form.widthIn) || undefined,
      heightIn: Number(form.heightIn) || undefined,
      upc: form.upc || undefined,
      mpn: form.mpn || undefined,
    });
  }

  async function saveDraft() {
    setSaving(true);
    const product = await buildAndSave("Draft");
    if (!product) {
      setSaving(false);
      return;
    }
    exportListingPacket({
      title: product.title,
      sku: product.sku,
      channel: "Draft",
      price: product.price,
      category: product.category,
      description: product.description,
      images: product.imageUrls,
      productId: product.id,
    });
    logEvent({
      section: "manifests",
      action: "Saved manual draft",
      resource: product.sku,
      resourceHref: "/manifests/new",
    });
    announce("Draft saved successfully.");
    setSaving(false);
  }

  async function saveAndList() {
    setSaving(true);
    const product = await buildAndSave("Active");
    if (!product) {
      setSaving(false);
      return;
    }
    const channel = form.channels[0]!;
    saveCreatedListing({
      id: `listing-${Date.now()}`,
      productId: product.id,
      channel,
      title: product.title,
      sku: product.sku,
      price: product.price,
      status: "Queued",
      createdAt: new Date().toISOString(),
    });
    exportListingPacket({
      title: product.title,
      sku: product.sku,
      channel,
      price: product.price,
      category: product.category,
      description: product.description,
      images: product.imageUrls,
      productId: product.id,
    });
    logEvent({
      section: "manifests",
      action: `Manual listed to ${channel}`,
      resource: product.sku,
      resourceHref: "/manifests/new",
    });
    announce(`Listing created for ${channel} (Queued).`);
    setSaving(false);
    setTimeout(() => {
      router.push(
        channel === "eBay" ? "/listings/ebay?status=Queued" : "/listings/shopgoodwill?status=Queued"
      );
    }, 800);
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="text-sm text-muted">
        <Link href="/manifests" className="text-primary hover:underline">
          Donor Item Creation
        </Link>{" "}
        &gt; Manual donor create
      </div>

      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 py-3 backdrop-blur">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Manual donor create</h1>
          <p className="text-sm text-muted">
            Photos + details for eBay and ShopGoodwill — tertiary to {BRAND.autoList} onboarding.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton
            justSaved={justSaved}
            saving={saving}
            savedLabel="Draft saved"
            onClick={() => void saveDraft()}
          >
            <Download className="h-4 w-4" /> Save draft
          </SaveButton>
          {justSaved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-save-ok">
              ✓ Saved
            </span>
          )}
          <Button variant="accent" type="button" disabled={saving} onClick={() => void saveAndList()}>
            <Upload className="h-4 w-4" /> Create listing
          </Button>
        </div>
      </div>

      <SaveToast feedback={feedback} />
      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 border-accent/25 bg-accent/[0.06] p-4">
        <InfinityBadge />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Ideal path: upload in {BRAND.ai}</p>
          <p className="text-xs text-muted">
            Push donor products through {BRAND.autoList} instead of filling the full manual form.
          </p>
        </div>
        <Link href={INFINITY_AI_UPLOAD_HREF}>
          <Button variant="accent" size="sm" type="button">
            <Rocket className="h-3.5 w-3.5" /> Upload in {BRAND.ai}
          </Button>
        </Link>
      </Card>

      <Card className="grid gap-4 p-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-ink">Batch barcode (optional)</label>
          <Input
            className="mt-1"
            value={batchBarcode}
            onChange={(e) => setBatchBarcode(e.target.value)}
            placeholder="e.g. BATCH-1001"
          />
          <p className="mt-1 text-xs text-muted">Ties this item to an intake batch when present.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Intake notes (optional)</label>
          <Input
            className="mt-1"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Floor notes, source cart, etc."
          />
        </div>
      </Card>

      <div className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm font-medium text-ink">
        Fill photos, title, description, category, condition, brand, price, quantity, and shipping —
        then add eBay and/or ShopGoodwill before Create listing.
      </div>

      <ListingEditorForm value={form} onChange={setForm} />
      <SaveConfirmBar show={justSaved} message="Draft saved successfully" />
    </div>
  );
}

export default function NewManifestPage() {
  return (
    <RoleGate path="/manifests/new">
      <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
        <ManualCreateInner />
      </Suspense>
    </RoleGate>
  );
}
