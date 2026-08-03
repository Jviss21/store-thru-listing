"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Download, ImagePlus, X } from "lucide-react";
import { Button, Card, PageHeader } from "@/components/ui";
import { ProductStatusBadge } from "@/components/StatusBadge";
import { ProductImage } from "@/components/ProductImage";
import {
  exportEbayListingPack,
  exportListingPacket,
  getCreatedProducts,
  getPhotoOverlay,
  setPhotoOverlay,
  type CreatedProduct,
} from "@/lib/demo-actions";
import { getProduct, listings } from "@/lib/mock-data";
import { readFilesAsDataUrls } from "@/lib/photos";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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
  const id = String(params.id ?? "");
  const seed = getProduct(id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(seed ?? null);
  const [overlay, setOverlay] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = getCreatedProducts().find((p) => p.id === id);
    if (seed) setProduct(seed);
    else if (local) setProduct(asProduct(local));
    setOverlay(getPhotoOverlay(id));
    setReady(true);
  }, [id, seed]);

  if (!ready) {
    return <div className="p-8 text-sm text-muted">Loading product…</div>;
  }

  if (!product) {
    return (
      <div className="space-y-3 p-8">
        <p className="font-medium">Product not found</p>
        <Link href="/products" className="text-sm text-primary hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  const photos = overlay.length ? overlay : product.imageUrls;
  const productListings = listings.filter((l) => l.productId === product.id);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const urls = await readFilesAsDataUrls(files);
    if (!urls.length) return;
    const next = [...(overlay.length ? overlay : product!.imageUrls), ...urls];
    setOverlay(next);
    setPhotoOverlay(product!.id, next);
    setFlash(`${urls.length} photo(s) added — saved in this browser.`);
    setTimeout(() => setFlash(null), 2500);
  }

  function removePhoto(url: string) {
    const base = overlay.length ? overlay : product!.imageUrls;
    const next = base.filter((u) => u !== url);
    setOverlay(next);
    setPhotoOverlay(product!.id, next);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={product.title}
        description={`${product.sku} · ${product.supplier}`}
        actions={
          <>
            <ProductStatusBadge status={product.status} />
            <Link
              href={`/products/new?title=${encodeURIComponent(product.title)}&sku=${encodeURIComponent(product.sku)}`}
            >
              <Button variant="outline" type="button">
                Edit details
              </Button>
            </Link>
            <Button
              variant="outline"
              type="button"
              onClick={() =>
                exportListingPacket({
                  title: product.title,
                  sku: product.sku,
                  channel: "ShopGoodwill",
                  price: product.price,
                  category: product.category,
                  description: product.description,
                  images: photos,
                  productId: product.id,
                })
              }
            >
              <Download className="h-4 w-4" /> SGW pack
            </Button>
            <Button
              variant="accent"
              type="button"
              onClick={() =>
                exportEbayListingPack({
                  title: product.title,
                  sku: product.sku,
                  channel: "eBay",
                  price: product.price,
                  category: product.category,
                  description: product.description,
                  images: photos,
                  productId: product.id,
                })
              }
            >
              <Download className="h-4 w-4" /> eBay pack
            </Button>
            <Link href="/listings/shopgoodwill">
              <Button type="button">List</Button>
            </Link>
          </>
        }
      />

      {flash && (
        <div className="rounded-xl border border-accent/35 bg-accent/10 px-4 py-2 text-sm text-ink">
          {flash}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Photos</h2>
            <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Upload
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
          <ProductImage
            src={photos[0]}
            seed={product.id}
            alt={product.title}
            className="aspect-square w-full"
            fallbackColor={product.imageColor}
          />
          <div className="grid grid-cols-4 gap-2">
            {(photos.length ? photos : [null]).slice(0, 8).map((url, i) => (
              <div key={url ?? `ph-${i}`} className="relative">
                <ProductImage
                  src={url}
                  seed={`${product.id}-${i}`}
                  alt=""
                  className="aspect-square w-full"
                />
                {url && overlay.includes(url) && (
                  <button
                    type="button"
                    className="absolute right-0.5 top-0.5 rounded bg-black/60 p-0.5 text-white"
                    onClick={() => removePhoto(url)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Price</dt>
              <dd className="font-medium">{formatCurrency(product.price)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Location</dt>
              <dd>{product.location}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Category</dt>
              <dd className="text-right text-xs">{product.categoryPath}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Created</dt>
              <dd className="text-right text-xs">
                {new Date(product.createdAt).toLocaleDateString()} by {product.createdBy}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="space-y-4 p-4 lg:col-span-2">
          <div>
            <h2 className="font-medium">Description</h2>
            <p className="mt-2 text-sm text-muted">{product.description || "No description yet."}</p>
          </div>
          <dl className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
            {[
              ["Private description", product.privateDescription ?? "—"],
              ["Strategy", product.strategy ?? "—"],
              ["Tags", (product.tags ?? []).join(", ") || "—"],
              ["Condition", product.condition ?? "—"],
              ["Brand", product.brand ?? "—"],
              ["MPN / UPC", `${product.mpn ?? "—"} / ${product.upc ?? "—"}`],
              ["Carrier", product.carrier ?? "—"],
              ["Product ID", product.uprightProductId ?? product.id],
              [
                "Weight / dims",
                product.weightLbs != null
                  ? `${product.weightLbs} lb · ${product.lengthIn}×${product.widthIn}×${product.heightIn} in`
                  : "—",
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right text-xs">{v}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h2 className="font-medium">Channel listings</h2>
            {productListings.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Not listed yet.</p>
            ) : (
              <ul className="mt-3 divide-y">
                {productListings.map((l) => (
                  <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{l.channel}</p>
                      <p className="text-xs text-muted">
                        {l.status} · {formatCurrency(l.price)}
                      </p>
                    </div>
                    <Link
                      href={`/listings/${l.channel === "eBay" ? "ebay" : "shopgoodwill"}?open=${l.id}`}
                      className="text-primary hover:underline"
                    >
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
