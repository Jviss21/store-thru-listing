"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, MapPin, Store } from "lucide-react";
import {
  ListingEditorForm,
  productToFormState,
  validateListingForm,
  type ListingFormState,
} from "@/components/ListingEditorForm";
import { ProductStatusBadge } from "@/components/StatusBadge";
import {
  SaveButton,
  SaveConfirmBar,
  SaveToast,
  useSaveFeedback,
} from "@/components/SaveFeedback";
import { Button } from "@/components/ui";
import { ItemPipelinePanel } from "@/components/ItemPipelinePanel";
import {
  exportEbayListingPack,
  exportListingPacket,
  getCreatedListings,
  getCreatedProducts,
  getPhotoOverlay,
  saveCreatedProduct,
  setPhotoOverlay,
  type CreatedProduct,
} from "@/lib/demo-actions";
import { mockEndOnSale, mockPublishChannels } from "@/lib/channel-sim";
import { getEbayAspectsClient } from "@/lib/api/ebay-aspects";
import { getProduct, listings } from "@/lib/mock-data";
import type { Product } from "@/lib/types";
import { useOrg } from "@/components/OrgProvider";
import { findShelfLocation } from "@/lib/putaway-store";
import {
  buildWorkflowSnapshot,
  listingsForProduct,
  productToWorkflowInput,
} from "@/lib/workflow";

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
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading product…</div>}>
      <ProductDetailInner />
    </Suspense>
  );
}

function ProductDetailInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { org } = useOrg();
  const id = String(params.id ?? "");

  const reservedDest = useMemo(() => {
    const reserved: Record<string, string> = {
      putaway: "/products/scan",
      scan: "/products/scan",
      "auto-list": "/infinity-ai",
      "auto-draft": "/products/auto-draft",
      "express-list": "/products/express-list",
      "scan-book": "/products/scan-book",
      draft: "/products/draft",
      new: "/products/new",
    };
    return reserved[id] ?? null;
  }, [id]);

  // Hardening: never treat known static product sub-routes as product ids.
  useEffect(() => {
    if (!reservedDest) return;
    const q = searchParams.toString();
    router.replace(q ? `${reservedDest}?${q}` : reservedDest);
  }, [reservedDest, router, searchParams]);

  const seed = getProduct(id);
  const [product, setProduct] = useState<Product | null>(seed ?? null);
  const [form, setForm] = useState<ListingFormState | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shelfName, setShelfName] = useState<string | null>(null);
  const [pipelineTick, setPipelineTick] = useState(0);
  const { feedback, justSaved, announce } = useSaveFeedback();

  useEffect(() => {
    const local = getCreatedProducts().find((p) => p.id === id);
    const overlay = getPhotoOverlay(id);
    let p: Product | null = seed ?? null;
    if (local) p = asProduct(local);
    if (p && overlay.length) p = { ...p, imageUrls: overlay };
    setProduct(p);
    if (p) {
      const base = productToFormState(p);
      const shelf = findShelfLocation(org.id, {
        barcode: p.upc,
        upc: p.upc,
        sku: p.sku,
      });
      setShelfName(shelf?.locationName ?? (p.location || null));
      setForm({
        ...base,
        channels: p.listedOn.length ? [...p.listedOn] : base.channels,
        location: shelf?.locationName || base.location,
      });
    }
    setReady(true);
  }, [id, seed, org.id, pipelineTick]);

  const pipelineListings = useMemo(() => {
    if (!product) return [];
    return listingsForProduct(product.id, listings, getCreatedListings());
  }, [product, pipelineTick]);

  const snapshot = useMemo(() => {
    if (!product) return null;
    return buildWorkflowSnapshot(productToWorkflowInput(product), {
      orgId: org.id,
      listings: pipelineListings,
    });
  }, [product, org.id, pipelineListings]);

  useEffect(() => {
    if (!ready || !product) return;
    if (searchParams.get("action") === "simulate-sale") {
      void (async () => {
        const result = await mockEndOnSale(product.id, "eBay");
        if (result) {
          announce(
            `Sold on eBay (mock). Ended ${result.ended.map((e) => e.channel).join(", ") || "no siblings"}.${
              result.marketNote ? ` ${result.marketNote}` : ""
            }`
          );
          setPipelineTick((t) => t + 1);
          router.replace(`/products/${encodeURIComponent(product.id)}`);
        }
      })();
    }
  }, [ready, product, searchParams, announce, router]);

  if (reservedDest) {
    return <div className="p-8 text-sm text-muted">Redirecting…</div>;
  }

  if (!ready) return <div className="p-8 text-sm text-muted">Loading product…</div>;
  if (!product || !form) {
    return (
      <div className="space-y-3 p-8">
        <p className="font-medium">Product not found</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const productListings = listings.filter((l) => l.productId === product.id);
  const createdListings = getCreatedListings().filter((l) => l.productId === product.id);
  const isDraft = product.status === "Draft";

  function refreshFromStore() {
    const local = getCreatedProducts().find((p) => p.id === id);
    if (local) setProduct(asProduct(local));
    setPipelineTick((t) => t + 1);
  }

  async function simulatePublish() {
    // Ensure product exists in created store for mock publish
    const existing = getCreatedProducts().find((p) => p.id === product!.id);
    if (!existing && product) {
      saveCreatedProduct({
        id: product.id,
        title: product.title,
        sku: product.sku,
        category: product.category,
        categoryPath: product.categoryPath,
        supplier: product.supplier,
        price: product.price,
        location: product.location,
        description: product.description ?? "",
        status: product.status === "Recycled" ? "Draft" : product.status,
        imageNames: [],
        imageUrls: product.imageUrls,
        createdAt: product.createdAt,
        listedOn: product.listedOn,
        condition: product.condition,
        brand: product.brand,
        strategy: product.strategy,
        tags: product.tags,
        upc: product.upc,
      });
    }
    const res = await mockPublishChannels(product!.id, ["ShopGoodwill", "eBay"]);
    if (res) {
      announce(res.marketUrl ? `${res.message} ${res.marketUrl}` : res.message);
      refreshFromStore();
    } else {
      announce("Could not mock-publish — save the product first.", { error: true });
    }
  }

  async function simulateSale() {
    const existing = getCreatedProducts().find((p) => p.id === product!.id);
    if (!existing && product) {
      saveCreatedProduct({
        id: product.id,
        title: product.title,
        sku: product.sku,
        category: product.category,
        categoryPath: product.categoryPath,
        supplier: product.supplier,
        price: product.price,
        location: product.location,
        description: product.description ?? "",
        status: "Active",
        imageNames: [],
        imageUrls: product.imageUrls,
        createdAt: product.createdAt,
        listedOn: product.listedOn.length ? product.listedOn : ["eBay", "ShopGoodwill"],
        condition: product.condition,
        brand: product.brand,
        strategy: product.strategy,
        tags: product.tags,
        upc: product.upc,
      });
      await mockPublishChannels(product.id, ["ShopGoodwill", "eBay"]);
    }
    const result = await mockEndOnSale(product!.id, "eBay");
    if (result) {
      announce(
        `Sold on eBay (mock). Ended sibling listings: ${
          result.ended.map((e) => e.channel).join(", ") || "none"
        }.${result.marketNote ? ` ${result.marketNote}` : ""}`
      );
      refreshFromStore();
    }
  }

  async function save() {
    if (!product || !form) return;
    setSaving(true);
    let aspects: import("@/lib/api/ebay-aspects").EbayAspect[] = [];
    if (form.channels.includes("eBay") && form.ebayCategoryId) {
      const aspectsRes = await getEbayAspectsClient().getEbayCategoryAspects(form.ebayCategoryId);
      if (aspectsRes.ok) aspects = aspectsRes.data.aspects;
    }
    const err = validateListingForm(form, aspects);
    if (err) {
      announce(err, { error: true });
      setSaving(false);
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
    announce(isDraft ? "Draft product saved." : "Product saved successfully.");
    setSaving(false);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              exportListingPacket({
                title: form.title,
                sku: form.sku,
                channel: "ShopGoodwill",
                price: Number(form.price) || product.price,
                category: form.category,
                description: form.description,
                images: form.imageUrls,
                productId: product.id,
              })
            }
          >
            <Download className="h-4 w-4" /> SGW pack
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              exportEbayListingPack({
                title: form.title,
                sku: form.sku,
                channel: "eBay",
                price: Number(form.startingPrice) || Number(form.price) || product.price,
                category: form.category,
                description: form.description,
                images: form.imageUrls,
                productId: product.id,
              })
            }
          >
            <Download className="h-4 w-4" /> eBay pack
          </Button>
          <Button variant="outline" type="button" onClick={() => router.push("/products")}>
            Cancel
          </Button>
          <SaveButton justSaved={justSaved} saving={saving} onClick={() => void save()} />
          {justSaved && (
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-save-ok">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      <SaveToast feedback={feedback} />

      {snapshot && (
        <ItemPipelinePanel
          snapshot={snapshot}
          sku={product.sku}
          primaryOverride={
            snapshot.stage.id === "listed" || snapshot.stage.id === "strategy"
              ? undefined
              : snapshot.stage.id === "photos" || snapshot.stage.id === "qa"
                ? {
                    label: "Mock publish SGW + eBay",
                    onClick: () => void simulatePublish(),
                  }
                : undefined
          }
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void simulatePublish()}>
          <Store className="h-3.5 w-3.5" /> Mock channel list
        </Button>
        <Button type="button" variant="accent" size="sm" onClick={() => void simulateSale()}>
          Simulate sold + end siblings
        </Button>
      </div>

      {isDraft && (
        <div className="rounded-xl border border-gold/40 bg-gold/15 px-4 py-3 text-sm font-medium text-ink">
          Draft product — will not be listed until you create a channel listing.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-mist/40 px-4 py-3 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
          <div>
            <p className="font-semibold text-ink">Find on shelf</p>
            <p className="text-muted">
              {shelfName ? (
                <>
                  Location: <span className="font-mono font-semibold text-ink">{shelfName}</span>
                </>
              ) : (
                "Not put away yet — scan barcode to assign a bin."
              )}
            </p>
          </div>
        </div>
        <Link
          href={`/products/scan?barcode=${encodeURIComponent(product.upc || product.sku)}`}
        >
          <Button type="button" variant="outline" size="sm">
            Scan / putaway
          </Button>
        </Link>
      </div>

      {productListings.length + createdListings.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-mist/40 px-4 py-3 text-sm">
          <p className="font-medium">Channel listings</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {productListings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.id}?from=/products/${product.id}`}
                  className="text-primary hover:underline"
                >
                  {l.channel} · {l.status} → Open / Edit
                </Link>
              </li>
            ))}
            {createdListings.map((l) => (
              <li key={l.id}>
                <span className="text-ink">
                  {l.channel} · {l.status}
                  <span className="ml-1 text-xs text-muted">(demo)</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ListingEditorForm
        value={form}
        onChange={setForm}
        productId={product.id}
        orgId={org.id}
      />
      <SaveConfirmBar show={justSaved} message="Product saved successfully" />
    </div>
  );
}