import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, PageHeader } from "@/components/ui";
import { ProductStatusBadge } from "@/components/StatusBadge";
import { getProduct, listings } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = getProduct(params.id);
  if (!product) notFound();
  const productListings = listings.filter((l) => l.productId === product.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={product.title}
        description={`${product.sku} · ${product.supplier}`}
        actions={
          <>
            <ProductStatusBadge status={product.status} />
            <Link href={`/products/new?title=${encodeURIComponent(product.title)}&sku=${encodeURIComponent(product.sku)}`}>
              <Button variant="outline" type="button">
                Edit details
              </Button>
            </Link>
            <Link href="/listings/shopgoodwill">
              <Button type="button">List</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <div
            className="aspect-square rounded-md border"
            style={{ background: product.imageColor }}
          />
          <dl className="mt-4 space-y-2 text-sm">
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
              <dd className="text-right">{product.category}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Created</dt>
              <dd>
                {new Date(product.createdAt).toLocaleDateString()} by {product.createdBy}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="font-medium">Description</h2>
          <p className="mt-2 text-sm text-muted">
            {product.description || "No description yet."}
          </p>
          <h2 className="mt-6 font-medium">Channel listings</h2>
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
        </Card>
      </div>
    </div>
  );
}
