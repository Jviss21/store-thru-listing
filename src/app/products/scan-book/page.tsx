"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Card, Input, PageHeader } from "@/components/ui";

const LOOKUPS: Record<string, { title: string; category: string }> = {
  "9780000000001": {
    title: "Sample Book 1 — Author Name",
    category: "Books & Media",
  },
  "9780000000002": {
    title: "Sample Book 2 — Author Name",
    category: "Books & Media",
  },
};

export default function ScanBookPage() {
  const router = useRouter();
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amazonLinked] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 600));
    const hit = LOOKUPS[isbn.trim()];
    setLoading(false);
    if (!hit) {
      setError("No match in demo catalog. Try 9780000000001 or 9780000000002.");
      return;
    }
    const qs = new URLSearchParams({
      sku: isbn.trim(),
      title: hit.title,
    });
    router.push(`/products/new?${qs.toString()}`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scan book"
        description="ISBN lookup prefills a new product. Link an Amazon account for richer catalog data (demo)."
      />

      <Card className="max-w-xl space-y-4 p-5">
        <div className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2 text-sm">
          <span>Amazon account</span>
          <span className={amazonLinked ? "text-mustard" : "text-muted"}>
            {amazonLinked ? "Connected" : "Not connected (demo)"}
          </span>
        </div>
        <form onSubmit={lookup} className="flex gap-2">
          <Input
            autoFocus
            placeholder="Scan or enter ISBN"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
          />
          <Button type="submit" disabled={loading || !isbn.trim()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Look up
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-muted">
          Demo ISBNs: 9780000000001 · 9780000000002
        </p>
      </Card>
    </div>
  );
}
