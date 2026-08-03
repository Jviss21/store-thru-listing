"use client";

import { Suspense } from "react";
import { SgwListingsInner } from "@/components/ChannelListingsTable";

export default function ShopGoodwillListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading listings…</div>}>
      <SgwListingsInner />
    </Suspense>
  );
}
