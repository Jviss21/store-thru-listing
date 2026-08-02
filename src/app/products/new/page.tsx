"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { Download, ImagePlus, Upload, X } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { CATEGORIES, SUPPLIERS, BRAND } from "@/lib/mock-data";
import { InfinityBadge } from "@/components/Brand";
import {
  exportListingPacket,
  saveCreatedListing,
  saveCreatedProduct,
  type CreatedProduct,
} from "@/lib/demo-actions";

type LocalImage = {
  id: string;
  name: string;
  url: string;
  main: boolean;
};

function NewProductInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(params.get("title") ?? "");
  const [sku, setSku] = useState(params.get("sku") ?? `SKU-${Date.now().toString().slice(-6)}`);
  const [category, setCategory] = useState(CATEGORIES[5]);
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [price, setPrice] = useState("24.99");
  const [location, setLocation] = useState("Location A");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<"ShopGoodwill" | "eBay">("ShopGoodwill");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: LocalImage[] = [];
    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith("image/")) return;
      next.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        url: URL.createObjectURL(file),
        main: images.length === 0 && i === 0,
      });
    });
    if (!next.length) {
      setError("Please choose image files (JPG, PNG, WebP, etc.).");
      return;
    }
    setError(null);
    setImages((prev) => {
      const merged = [...prev, ...next];
      if (!merged.some((img) => img.main) && merged[0]) merged[0].main = true;
      return merged;
    });
  }

  function buildProduct(status: "Draft" | "Active"): CreatedProduct | null {
    if (!title.trim() || !sku.trim()) {
      setError("Title and SKU are required.");
      return null;
    }
    return {
      id: `local-${Date.now()}`,
      title: title.trim(),
      sku: sku.trim(),
      category,
      supplier,
      price: Number(price) || 0,
      location,
      description,
      status,
      imageNames: images.map((img) => img.name),
      createdAt: new Date().toISOString(),
      listedOn: [],
    };
  }

  function saveDraft() {
    const product = buildProduct("Draft");
    if (!product) return;
    saveCreatedProduct(product);
    setMessage("Draft saved in this browser. Downloading product JSON…");
    exportListingPacket({
      title: product.title,
      sku: product.sku,
      channel: "Draft",
      price: product.price,
      category: product.category,
      description: product.description,
      images: product.imageNames,
    });
  }

  function saveAndList() {
    const product = buildProduct("Active");
    if (!product) return;
    saveCreatedProduct(product);
    const listing = saveCreatedListing({
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
      title: listing.title,
      sku: listing.sku,
      channel: listing.channel,
      price: listing.price,
      category: product.category,
      description: product.description,
      images: product.imageNames,
    });
    setMessage(
      `Listing created for ${channel}. CSV + JSON downloaded. Opening listings…`
    );
    setTimeout(() => {
      router.push(
        channel === "eBay" ? "/listings/ebay?status=Queued" : "/listings/shopgoodwill?status=Queued"
      );
    }, 900);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-sm text-muted">
            Upload photos, fill details, then save a draft or create a listing (downloads files).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={saveDraft}>
            <Download className="h-4 w-4" />
            Save draft + download
          </Button>
          <Button variant="accent" type="button" onClick={saveAndList}>
            <Upload className="h-4 w-4" />
            Create listing + download
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          {error}
        </div>
      )}

      <Card className="flex flex-wrap items-center gap-3 border-teal/20 bg-teal/5 p-4">
        <InfinityBadge />
        <p className="text-sm text-ink/80">
          Prefer speed? Send accepted intake through {BRAND.autoDraft}, then publish with {BRAND.autoList}.
        </p>
        <Link href="/products/auto-draft" className="ml-auto text-sm font-semibold text-teal hover:underline">
          Open {BRAND.autoDraft}
        </Link>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Photos</h2>
          <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Upload photos
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>

        <div
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-mist/50 px-4 py-10 text-center transition hover:border-ink/30 hover:bg-mist"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          <ImagePlus className="h-8 w-8 text-muted" />
          <p className="mt-2 text-sm font-semibold text-ink">Drag & drop images here</p>
          <p className="mt-1 text-xs text-muted">or click to browse — files stay in your browser for this demo</p>
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl border border-ink/10 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                {img.main && (
                  <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                  onClick={() =>
                    setImages((prev) => {
                      const next = prev.filter((x) => x.id !== img.id);
                      if (img.main && next[0]) next[0].main = true;
                      return next;
                    })
                  }
                >
                  <X className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-ink"
                  onClick={() =>
                    setImages((prev) =>
                      prev.map((x) => ({ ...x, main: x.id === img.id }))
                    )
                  }
                >
                  Set main
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          {images.length} photo{images.length === 1 ? "" : "s"} attached
          {images.length ? ` (${images.map((i) => i.name).join(", ")})` : ""}.
        </p>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold">Product info</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Category</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Title</label>
              <span className="text-xs text-muted">{title.length}/80</span>
            </div>
            <Input
              className="mt-1"
              value={title}
              maxLength={80}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Listing title"
            />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <Input className="mt-1" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Price</label>
            <Input className="mt-1" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Supplier</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            >
              {SUPPLIERS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input className="mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">List to channel</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value as "ShopGoodwill" | "eBay")}
            >
              <option value="ShopGoodwill">ShopGoodwill</option>
              <option value="eBay">eBay</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              className="mt-1"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition notes, measurements, included accessories…"
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/products">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <Button variant="outline" type="button" onClick={saveDraft}>
          Save draft + download
        </Button>
        <Button variant="accent" type="button" onClick={saveAndList}>
          Create listing + download
        </Button>
      </div>
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
