/**
 * Demo SKU / unit-barcode helpers for Donor Item Creation.
 * Sequence + prefix live in Admin IMS (`stl-admin-ims`) under manifests.*;
 * this module keeps a visual barcode stub and a thin allocate wrapper.
 */

import {
  allocateDonorSkuBarcode,
  formatDonorSku,
  loadAdminIms,
  peekNextDonorSku,
} from "@/lib/admin-ims";
import { DEFAULT_ORG_ID } from "@/lib/orgs";

const LEGACY_COUNTER_KEY = "test-goodwill-demo-sku-counter";

/** @deprecated Prefer allocateDonorSkuBarcode(orgId) — kept for callers that only need a string. */
export function nextDonorSku(existingSkus: string[] = [], orgId = DEFAULT_ORG_ID): string {
  const taken = new Set(existingSkus.map((s) => s.toUpperCase()));
  let { sku, state } = allocateDonorSkuBarcode(orgId);
  while (taken.has(sku.toUpperCase())) {
    const again = allocateDonorSkuBarcode(orgId);
    sku = again.sku;
    state = again.state;
  }
  // Keep legacy key roughly in sync for clear-local-storage demos
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LEGACY_COUNTER_KEY, String(state.manifests.lastIssuedSequence));
    }
  } catch {
    /* ignore */
  }
  return sku;
}

export function previewNextDonorSku(orgId = DEFAULT_ORG_ID): string {
  const manifests = loadAdminIms(orgId).manifests;
  return peekNextDonorSku(manifests);
}

export function formatSku(prefix: string, sequence: number) {
  return formatDonorSku(prefix, sequence);
}

/** Visual stub bars for demo labels (not a real barcode symbology). */
export function barcodeStubBars(value: string): string {
  const seed = value.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const parts: string[] = [];
  for (let i = 0; i < 18; i++) {
    const thick = ((seed + i * 7) % 5) + 1;
    parts.push("|".repeat(thick));
  }
  return parts.join(" ");
}
