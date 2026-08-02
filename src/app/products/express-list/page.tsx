"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, PageHeader, Input } from "@/components/ui";
import { BRAND, products } from "@/lib/mock-data";

export default function QuickListPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const existing = products.find(
      (p) => p.sku.toLowerCase() === query.trim().toLowerCase()
    );
    if (existing) {
      setHint(`Found existing product — opening ${existing.sku}`);
      router.push(`/products/${existing.id}`);
      return;
    }
    router.push(`/products/new?sku=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={BRAND.quickList}
        description="Scan a SKU/barcode to jump straight into listing."
      />
      <Card className="max-w-xl p-5">
        <form onSubmit={go} className="flex gap-2">
          <Input
            autoFocus
            placeholder="SKU or barcode"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit">Go</Button>
        </form>
        {hint && <p className="mt-3 text-sm text-muted">{hint}</p>}
        <p className="mt-3 text-xs text-muted">
          Try an existing SKU like SKU-1001 or enter a new barcode.
        </p>
      </Card>
    </div>
  );
}
