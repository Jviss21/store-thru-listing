"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  ListingEditorForm,
  emptyFormState,
  type ListingFormState,
} from "@/components/ListingEditorForm";
import { Button, Card } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { exportListingPacket, saveCreatedListing, saveCreatedProduct } from "@/lib/demo-actions";
import { BRAND, CATEGORY_PATHS } from "@/lib/mock-data";

function NewProductInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState<ListingFormState>(() => {
    const base = emptyFormState();
    return { ...base, title: params.get("title") ?? "", sku: params.get("sku") ?? base.sku, channels: [] };
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildAndSave(status: "Draft" | "Active") {
    if (!form.title.trim() || !form.sku.trim()) {
      setError("Title and SKU are required.");
      return null;
    }
    if (status === "Active" && form.channels.length === 0) {
      setError("Add at least one channel before creating a listing.");
      return null;
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

  function saveDraft() {
    const product = buildAndSave("Draft");
    if (!product) return;
    setMessage("Draft saved.");
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
  }

  function saveAndList() {
    const product = buildAndSave("Active");
    if (!product) return;
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
    setMessage(`Listing created for ${channel} (Queued).`);
    setTimeout(() => {
      router.push(channel === "eBay" ? "/listings/ebay?status=Queued" : "/listings/shopgoodwill?status=Queued");
    }, 800);
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 py-3 backdrop-blur">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-sm text-muted">Full product + channel form with photos and specifics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={saveDraft}><Download className="h-4 w-4" /> Save draft</Button>
          <Button variant="accent" type="button" onClick={saveAndList}><Upload className="h-4 w-4" /> Create listing</Button>
        </div>
      </div>
      {message && <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 text-sm">{message}</div>}
      {error && <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</div>}
      <Card className="flex flex-wrap items-center gap-3 border-accent/25 bg-accent/[0.06] p-4">
        <InfinityBadge />
        <p className="text-sm">Prefer speed? Use {BRAND.autoList}.</p>
        <Link href="/products/auto-list" className="ml-auto text-sm font-semibold text-brand-orange hover:underline">Open {BRAND.autoList}</Link>
      </Card>
      <ListingEditorForm value={form} onChange={setForm} />
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
