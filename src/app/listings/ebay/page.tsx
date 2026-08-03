"use client";

import { Suspense } from "react";
import { EbayListingsInner } from "@/components/ChannelListingsTable";

export default function EbayListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading listings…</div>}>
      <EbayListingsInner />
    </Suspense>
  );
}
