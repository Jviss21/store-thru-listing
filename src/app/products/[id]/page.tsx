"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import {
  ListingEditorForm,
  productToFormState,
  validateListingForm,
  type ListingFormState,
} from "@/components/ListingEditorForm";
import { ProductStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui";
import {
  exportEbayListingPack,
  exportListingPacket,
  getCreatedProducts,
  getPhotoOverlay,
  saveCreatedProduct,
  setPhotoOverlay,
  type CreatedProduct,
} from "@/lib/demo-actions";
import { getEbayAspectsClient } from "@/lib/api/ebay-aspects";
import { getProduct, listings } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

function asProduct(created: CreatedProduct): Product {
  return {
    id: created.id,
    title: created.title,
    sku: created.sku,
    status: created.status,
    location: created.location,
    supplier: created.supplier,
    createdBy: "jdoe",
    createdAt: created.createdAt,
    category: created.category,
    categoryPath: created.categoryPath ?? created.category,
    price: created.price,
    imageColor: "#f0b429",
    imageUrls: created.imageUrls?.length ? created.imageUrls : [],
    listedOn: (created.listedOn ?? []) as Product["listedOn"],
    description: created.description,
    privateDescription: created.privateDescription,
    carrier: created.carrier,
    condition: created.condition,
    brand: created.brand,
    mpn: created.mpn,
    upc: created.upc,
    weightLbs: created.weightLbs,
    lengthIn: created.lengthIn,
    widthIn: created.widthIn,
    heightIn: created.heightIn,
    strategy: created.strategy,
    tags: created.tags,
    subtitle: created.subtitle,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const seed = getProduct(id);
  const [product, setProduct] = useState<Product | null>(seed ?? null);
  const [form, setForm] = useState<ListingFormState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = getCreatedProducts().find((p) => p.id === id);
    const overlay = getPhotoOverlay(id);
    let p: Product | null = seed ?? null;
    if (local) p = asProduct(local);
    if (p && overlay.length) p = { ...p, imageUrls: overlay };
    setProduct(p);
    if (p) {
      const base = productToFormState(p);
      setForm({ ...base, channels: p.listedOn.length ? [...p.listedOn] : base.channels });
    }
    setReady(true);
  }, [id, seed]);

  if (!ready) return <div className="p-8 text-sm text-muted">Loading product…</div>;
  if (!product || !form) {
    return (
      <div className="space-y-3 p-8">
        <p className="font-medium">Product not found</p>
        <Link href="/products" className="text-sm text-primary hover:underline">Back to products</Link>
      </div>
    );
  }

  const productListings = listings.filter((l) => l.productId === product.id);

  async function save() {
    if (!product || !form) return;
    let aspects: import("@/lib/api/ebay-aspects").EbayAspect[] = [];
    if (form.channels.includes("eBay") && form.ebayCategoryId) {
      const aspectsRes = await getEbayAspectsClient().getEbayCategoryAspects(form.ebayCategoryId);
      if (aspectsRes.ok) aspects = aspectsRes.data.aspects;
    }
    const err = validateListingForm(form, aspects);
    if (err) {
      setFlash(err);
      setTimeout(() => setFlash(null), 3500);
      return;
    }
    setPhotoOverlay(product.id, form.imageUrls);
    saveCreatedProduct({
      id: product.id,
      title: form.title.trim(),
      sku: form.sku.trim(),
      category: form.category,
      categoryPath: form.categoryPath,
      supplier: form.supplier,
      price: Number(form.price) || Number(form.startingPrice) || product.price,
      location: form.location,
      description: form.description,
      privateDescription: form.privateDescription,
      status: product.status === "Draft" ? "Draft" : "Active",
      imageNames: form.imageUrls.map((_, i) => `photo-${i + 1}.jpg`),
      imageUrls: form.imageUrls,
      createdAt: product.createdAt,
      listedOn: form.channels,
      condition: form.condition,
      brand: form.brand || form.itemSpecifics.Brand,
      carrier: form.carrier,
      strategy: form.strategy,
      tags: form.tags,
      weightLbs: Number(form.weightLbs) || undefined,
      lengthIn: Number(form.lengthIn) || undefined,
      widthIn: Number(form.widthIn) || undefined,
      heightIn: Number(form.heightIn) || undefined,
      upc: form.upc || undefined,
      mpn: form.mpn || undefined,
    });
    setProduct({
      ...product,
      title: form.title.trim(),
      sku: form.sku.trim(),
      imageUrls: form.imageUrls,
      listedOn: form.channels as Product["listedOn"],
      description: form.description,
      mainImageIndex: form.mainImageIndex,
      itemSpecifics: form.itemSpecifics,
      strategy: form.strategy,
      brand: form.brand || form.itemSpecifics.Brand,
      condition: form.condition,
      weightLbs: Number(form.weightLbs) || undefined,
      lengthIn: Number(form.lengthIn) || undefined,
      widthIn: Number(form.widthIn) || undefined,
      heightIn: Number(form.heightIn) || undefined,
    });
    setFlash("Product saved.");
    setTimeout(() => setFlash(null), 2500);
  }

  return (
    <div className="space-y-4 pb-16">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-white/95 py-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">Edit product</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <ProductStatusBadge status={product.status} />
              <span className="font-mono">{product.sku}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={() => exportListingPacket({ title: form.title, sku: form.sku, channel: "ShopGoodwill", price: Number(form.price) || product.price, category: form.category, description: form.description, images: form.imageUrls, productId: product.id })}>
            <Download className="h-4 w-4" /> SGW pack
          </Button>
          <Button variant="outline" type="button" onClick={() => exportEbayListingPack({ title: form.title, sku: form.sku, channel: "eBay", price: Number(form.startingPrice) || Number(form.price) || product.price, category: form.category, description: form.description, images: form.imageUrls, productId: product.id })}>
            <Download className="h-4 w-4" /> eBay pack
          </Button>
          <Button variant="outline" type="button" onClick={() => router.push("/products")}>Cancel</Button>
          <Button type="button" onClick={() => void save()}>Save</Button>
        </div>
      </div>
      {flash && <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm">{flash}</div>}
      {productListings.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-mist/40 px-4 py-3 text-sm">
          <p className="font-medium">Channel listings</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {productListings.map((l) => (
              <li key={l.id}>
                <Link href={`/listings/${l.id}?from=/products/${product.id}`} className="text-primary hover:underline">
                  {l.channel} · {l.status} → Open / Edit
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ListingEditorForm value={form} onChange={setForm} />
    </div>
  );
}
