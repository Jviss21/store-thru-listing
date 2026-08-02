"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, PageHeader } from "@/components/ui";

export default function DraftProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add draft product"
        description="Quick capture — finish photos and marketplace fields later."
      />
      <Card className="max-w-xl space-y-4 p-5">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">SKU (optional)</label>
          <Input className="mt-1" value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => router.push("/products?status=Draft")}
            disabled={!title.trim()}
          >
            Save draft
          </Button>
          <Link href="/products/new">
            <Button variant="outline" type="button">
              Continue to full form
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
