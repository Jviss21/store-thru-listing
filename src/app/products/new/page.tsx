"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Download, Upload } from "lucide-react";
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
import { Button, Card } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { exportListingPacket, saveCreatedListing, saveCreatedProduct } from "@/lib/demo-actions";
import { getEbayAspectsClient } from "@/lib/api/ebay-aspects";
import { BRAND, CATEGORY_PATHS, INFINITY_AI_UPLOAD_HREF } from "@/lib/mock-data";

function NewProductInner() {
  const router = useRouter();
  const params = useSearchParams();
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
    if (status === "Active" && form.channels.length === 0) {
      setError("Add at least one channel before creating a listing.");
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
      tags: form.tags.length ? form.tags : ["Demo"],
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
        &gt;{" "}
        <Link href="/manifests/new" className="text-primary hover:underline">
          Manual donor create
        </Link>{" "}
        &gt; New product
      </div>
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 py-3 backdrop-blur">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-sm text-muted">
            Full product + channel form — tertiary to {BRAND.autoList} onboarding. Prefer{" "}
            <Link href="/manifests/new" className="font-semibold text-brand-orange hover:underline">
              Manual donor create
            </Link>{" "}
            from Donor Item Creation.
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
      <div className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm font-medium text-ink">
        Draft product — will not be listed until you create a channel listing.
      </div>
      <Card className="flex flex-wrap items-center gap-3 border-accent/25 bg-accent/[0.06] p-4">
        <InfinityBadge />
        <p className="min-w-0 flex-1 text-sm">
          Ideal path: upload products in {BRAND.ai} and push with {BRAND.autoList}.
        </p>
        <Link
          href={INFINITY_AI_UPLOAD_HREF}
          className="text-sm font-semibold text-brand-orange hover:underline"
        >
          Upload in {BRAND.ai}
        </Link>
      </Card>
      <ListingEditorForm value={form} onChange={setForm} />
      <SaveConfirmBar show={justSaved} message="Draft saved successfully" />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <NewProductInner />
    </Suspense>
  );
}
