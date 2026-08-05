/**
 * Org-scoped barcode → inventory location putaway map (localStorage).
 * Maps donor-create barcodes / SKUs to Admin Inventory Locations.
 *
 * When Prisma Product.location / Product.barcode exist, /api/inventory/putaway
 * also updates the DB row.
 */

import { DEFAULT_ORG_ID } from "@/lib/orgs";
import { loadAdminIms, type InventoryLocation } from "@/lib/admin-ims";

export const PUTAWAY_KEY_PREFIX = "stl-putaway:";

export type PutawayRecord = {
  barcode: string;
  sku: string;
  productId: string | null;
  locationId: string;
  locationName: string;
  assignedAt: string;
  assignedBy?: string;
};

function key(orgId: string) {
  return `${PUTAWAY_KEY_PREFIX}${orgId || DEFAULT_ORG_ID}`;
}

function readMap(orgId: string): Record<string, PutawayRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key(orgId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PutawayRecord>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(orgId: string, map: Record<string, PutawayRecord>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(orgId), JSON.stringify(map));
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function listPutaways(orgId: string): PutawayRecord[] {
  return Object.values(readMap(orgId)).sort((a, b) =>
    b.assignedAt.localeCompare(a.assignedAt)
  );
}

export function getPutawayByBarcode(orgId: string, barcode: string): PutawayRecord | null {
  const map = readMap(orgId);
  const code = normalizeCode(barcode);
  if (map[code]) return map[code];
  // Also match by sku field
  return Object.values(map).find((r) => normalizeCode(r.sku) === code) ?? null;
}

export function assignPutaway(
  orgId: string,
  input: {
    barcode: string;
    sku?: string;
    productId?: string | null;
    locationId: string;
    locationName: string;
    assignedBy?: string;
  }
): PutawayRecord {
  const map = readMap(orgId);
  const barcode = normalizeCode(input.barcode);
  const record: PutawayRecord = {
    barcode,
    sku: (input.sku || barcode).trim(),
    productId: input.productId ?? null,
    locationId: input.locationId,
    locationName: input.locationName,
    assignedAt: new Date().toISOString(),
    assignedBy: input.assignedBy,
  };
  map[barcode] = record;
  writeMap(orgId, map);
  return record;
}

export function clearPutaways(orgId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(orgId));
}

export function inventoryLocationsForOrg(orgId: string): InventoryLocation[] {
  return loadAdminIms(orgId).inventoryLocations;
}

/** Resolve shelf display for a product by barcode, upc, or sku. */
export function findShelfLocation(
  orgId: string,
  codes: { barcode?: string | null; upc?: string | null; sku?: string | null }
): PutawayRecord | null {
  for (const c of [codes.barcode, codes.upc, codes.sku]) {
    if (!c) continue;
    const hit = getPutawayByBarcode(orgId, c);
    if (hit) return hit;
  }
  return null;
}
