/**
 * Org-scoped pick lists + order fulfillment overlays (localStorage).
 * Path to DB: PickList / PickListLine / Order.pickPackStatus tables keyed by orgId.
 */

import { DEFAULT_ORG_ID } from "@/lib/orgs";
import { loadSession } from "@/lib/session";
import { logEvent } from "@/lib/event-log";
import { orders as seedOrders } from "@/lib/mock-data";
import type {
  Order,
  OrderFulfillment,
  PickPackStatus,
} from "@/lib/types";

export const PICK_LISTS_KEY_PREFIX = "stl-pick-lists:";
export const ORDER_OVERRIDES_KEY_PREFIX = "stl-order-overrides:";
export const PICK_LISTS_CHANGED = "stl-pick-lists-changed";

export type PickLineStatus = "pending" | "picked" | "not_found";

export type PickListLine = {
  id: string;
  orderId: string;
  orderNumber: string;
  sku: string;
  barcode: string;
  title: string;
  location: string;
  qty: number;
  pickedQty: number;
  status: PickLineStatus;
  pickedBy?: string;
  pickedAt?: string;
};

export type PickListStatus = "open" | "picking" | "picked" | "packed" | "cancelled";

export type PickList = {
  id: string;
  profile: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  lockedUntil: string | null;
  status: PickListStatus;
  orderIds: string[];
  lines: PickListLine[];
  packedBy?: string;
  packedByName?: string;
  packedAt?: string;
};

export type OrderOverride = {
  orderId: string;
  pickPackStatus?: PickPackStatus;
  fulfillmentStatus?: OrderFulfillment;
  isNotFound?: boolean;
};

type PickListsBlob = { orgId: string; lists: PickList[]; seq: number };
type OverridesBlob = { orgId: string; byId: Record<string, OrderOverride> };

function pickKey(orgId: string) {
  return `${PICK_LISTS_KEY_PREFIX}${orgId || DEFAULT_ORG_ID}`;
}
function overrideKey(orgId: string) {
  return `${ORDER_OVERRIDES_KEY_PREFIX}${orgId || DEFAULT_ORG_ID}`;
}

function emitChanged(orgId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(PICK_LISTS_CHANGED, { detail: { orgId } })
  );
}

function readLists(orgId: string): PickListsBlob {
  if (typeof window === "undefined") return { orgId, lists: [], seq: 1040 };
  try {
    const raw = localStorage.getItem(pickKey(orgId));
    if (!raw) return { orgId, lists: [], seq: 1040 };
    const parsed = JSON.parse(raw) as PickListsBlob;
    return {
      orgId: parsed.orgId || orgId,
      lists: Array.isArray(parsed.lists) ? parsed.lists : [],
      seq: typeof parsed.seq === "number" ? parsed.seq : 1040,
    };
  } catch {
    return { orgId, lists: [], seq: 1040 };
  }
}

function writeLists(orgId: string, blob: PickListsBlob) {
  localStorage.setItem(pickKey(orgId), JSON.stringify({ ...blob, orgId }));
  emitChanged(orgId);
}

function readOverrides(orgId: string): OverridesBlob {
  if (typeof window === "undefined") return { orgId, byId: {} };
  try {
    const raw = localStorage.getItem(overrideKey(orgId));
    if (!raw) return { orgId, byId: {} };
    const parsed = JSON.parse(raw) as OverridesBlob;
    return {
      orgId: parsed.orgId || orgId,
      byId: parsed.byId && typeof parsed.byId === "object" ? parsed.byId : {},
    };
  } catch {
    return { orgId, byId: {} };
  }
}

function writeOverrides(orgId: string, blob: OverridesBlob) {
  localStorage.setItem(overrideKey(orgId), JSON.stringify({ ...blob, orgId }));
  emitChanged(orgId);
}

export function clearPickLists(orgId?: string) {
  if (typeof window === "undefined") return;
  if (orgId) {
    localStorage.removeItem(pickKey(orgId));
    localStorage.removeItem(overrideKey(orgId));
    emitChanged(orgId);
    return;
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (
      k?.startsWith(PICK_LISTS_KEY_PREFIX) ||
      k?.startsWith(ORDER_OVERRIDES_KEY_PREFIX)
    ) {
      localStorage.removeItem(k);
    }
  }
}

export function getPickLists(orgId: string): PickList[] {
  return readLists(orgId).lists;
}

export function getPickList(orgId: string, id: string): PickList | null {
  return readLists(orgId).lists.find((l) => l.id === id) ?? null;
}

export function applyOrderOverrides(orgId: string, orders: Order[]): Order[] {
  const { byId } = readOverrides(orgId);
  return orders.map((o) => {
    const ov = byId[o.id];
    if (!ov) return o;
    return {
      ...o,
      pickPackStatus: ov.pickPackStatus ?? o.pickPackStatus,
      fulfillmentStatus: ov.fulfillmentStatus ?? o.fulfillmentStatus,
      isNotFound: ov.isNotFound ?? o.isNotFound,
    };
  });
}

export function getLiveOrders(orgId: string): Order[] {
  return applyOrderOverrides(orgId, seedOrders);
}

/** Expand multi-item orders into pick lines (synthetic line items for demo). */
export function buildPickLinesForOrders(orders: Order[]): PickListLine[] {
  const lines: PickListLine[] = [];
  for (const o of orders) {
    const count = Math.max(1, o.itemCount || 1);
    for (let i = 0; i < count; i++) {
      const suffix = count > 1 ? `-${String(i + 1).padStart(2, "0")}` : "";
      const sku = count > 1 ? `${o.sku}${suffix}` : o.sku;
      const loc =
        count > 1 && i > 0
          ? nudgeLocation(o.location, i)
          : o.location;
      lines.push({
        id: `${o.id}-line-${i + 1}`,
        orderId: o.id,
        orderNumber: o.orderNumber,
        sku,
        barcode: sku,
        title: count > 1 ? `${o.title} · item ${i + 1}` : o.title,
        location: loc,
        qty: 1,
        pickedQty: 0,
        status: "pending",
      });
    }
  }
  return sortLinesByLocation(lines);
}

function nudgeLocation(loc: string, offset: number): string {
  // Keep aisle prefix; bump bin for adjacent picks in multi-item demo.
  const m = loc.match(/^([A-H])\s*-\s*(\d+)\s*-\s*(\d+)$/i);
  if (m) {
    const aisle = m[1]!.toUpperCase();
    const bay = Number(m[2]);
    const bin = Number(m[3]) + offset;
    return `${aisle} - ${bay} - ${bin}`;
  }
  if (loc.startsWith("Cart")) return loc;
  return `${loc} · ${offset + 1}`;
}

export function sortLinesByLocation(lines: PickListLine[]): PickListLine[] {
  return [...lines].sort((a, b) => {
    const c = a.location.localeCompare(b.location, undefined, {
      numeric: true,
      sensitivity: "base",
    });
    if (c !== 0) return c;
    return a.sku.localeCompare(b.sku);
  });
}

export function groupLinesByLocation(
  lines: PickListLine[]
): { location: string; lines: PickListLine[] }[] {
  const map = new Map<string, PickListLine[]>();
  for (const line of sortLinesByLocation(lines)) {
    const arr = map.get(line.location) ?? [];
    arr.push(line);
    map.set(line.location, arr);
  }
  return Array.from(map.entries()).map(([location, group]) => ({
    location,
    lines: group,
  }));
}

export type CreatePickListInput = {
  orgId: string;
  orderIds?: string[];
  /** When omitted, takes open paid unfulfilled / partial orders not already packed. */
  profile?: string;
  lockHours?: number;
};

export function createPickListFromOpenOrders(input: CreatePickListInput): PickList {
  const orgId = input.orgId || DEFAULT_ORG_ID;
  const session = loadSession();
  const live = getLiveOrders(orgId);
  const candidates =
    input.orderIds?.length
      ? live.filter((o) => input.orderIds!.includes(o.id))
      : live.filter(
          (o) =>
            o.paymentStatus === "Paid" &&
            o.fulfillmentStatus !== "Fulfilled" &&
            o.pickPackStatus !== "Packed" &&
            o.pickPackStatus !== "Not found"
        );

  // Prefer not-started / being-pulled; cap wave size for demo usability
  const wave = candidates
    .filter((o) =>
      ["Not started", "Being pulled", "Picked"].includes(o.pickPackStatus)
    )
    .slice(0, 24);

  const source = wave.length ? wave : candidates.slice(0, 12);
  if (!source.length) {
    throw new Error("No open orders available for a pick list.");
  }

  const blob = readLists(orgId);
  const seq = blob.seq + 1;
  const id = `PL-${seq}`;
  const now = new Date();
  const lockHours = input.lockHours ?? 8;
  const lockedUntil = new Date(now.getTime() + lockHours * 3600000).toISOString();

  const list: PickList = {
    id,
    profile:
      input.profile ??
      (source.some((o) => o.orderType === "Multi")
        ? "Ready to fulfill · Multi + Single"
        : "Ready to fulfill · Standard"),
    createdBy: session.handle || "floor",
    createdByName: session.name || session.handle || "Floor user",
    createdAt: now.toISOString(),
    lockedUntil,
    status: "open",
    orderIds: source.map((o) => o.id),
    lines: buildPickLinesForOrders(source),
  };

  writeLists(orgId, { orgId, lists: [list, ...blob.lists], seq });

  // Mark orders being pulled
  const ov = readOverrides(orgId);
  for (const o of source) {
    ov.byId[o.id] = {
      ...ov.byId[o.id],
      orderId: o.id,
      pickPackStatus: "Being pulled",
      isNotFound: false,
    };
  }
  writeOverrides(orgId, ov);

  logEvent({
    section: "orders",
    action: `Created pick list ${id}`,
    resource: `${list.lines.length} lines · ${source.length} orders`,
    resourceHref: `/orders/pick-lists/${id}`,
    entityId: id,
    detail: list.profile,
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId,
  });

  return list;
}

function syncOrderStatusesFromList(orgId: string, list: PickList) {
  const ov = readOverrides(orgId);
  const byOrder = new Map<string, PickListLine[]>();
  for (const line of list.lines) {
    const arr = byOrder.get(line.orderId) ?? [];
    arr.push(line);
    byOrder.set(line.orderId, arr);
  }

  for (const entry of Array.from(byOrder.entries())) {
    const orderId = entry[0];
    const lines = entry[1];
    const allPicked = lines.every((l: PickListLine) => l.status === "picked");
    const anyNotFound = lines.some((l: PickListLine) => l.status === "not_found");
    const anyPicked = lines.some(
      (l: PickListLine) => l.status === "picked" || l.pickedQty > 0
    );

    let pickPackStatus: PickPackStatus = "Being pulled";
    if (list.status === "packed") pickPackStatus = "Packed";
    else if (anyNotFound && !allPicked) pickPackStatus = "Not found";
    else if (allPicked || list.status === "picked") pickPackStatus = "Picked";
    else if (anyPicked) pickPackStatus = "Being pulled";

    ov.byId[orderId] = {
      ...ov.byId[orderId],
      orderId,
      pickPackStatus,
      isNotFound: pickPackStatus === "Not found",
      fulfillmentStatus:
        list.status === "packed"
          ? "Fulfilled"
          : ov.byId[orderId]?.fulfillmentStatus,
    };
  }
  writeOverrides(orgId, ov);
}

export function scanPickLine(
  orgId: string,
  listId: string,
  code: string
): { ok: true; list: PickList; line: PickListLine; message: string } | { ok: false; message: string; list: PickList | null } {
  const blob = readLists(orgId);
  const list = blob.lists.find((l) => l.id === listId) ?? null;
  if (!list) return { ok: false, message: "Pick list not found.", list: null };

  const raw = code.trim();
  if (!raw) return { ok: false, message: "Scan a SKU or barcode.", list };

  const needle = raw.toUpperCase();
  const line =
    list.lines.find(
      (l) =>
        l.status === "pending" &&
        (l.sku.toUpperCase() === needle ||
          l.barcode.toUpperCase() === needle ||
          l.orderNumber.toUpperCase() === needle)
    ) ??
    list.lines.find(
      (l) =>
        l.sku.toUpperCase() === needle ||
        l.barcode.toUpperCase() === needle ||
        l.orderNumber.toUpperCase() === needle
    );

  if (!line) {
    return { ok: false, message: `No match for “${raw}” on this list.`, list };
  }
  if (line.status === "picked") {
    return { ok: false, message: `${line.sku} already picked.`, list };
  }

  const session = loadSession();
  const now = new Date().toISOString();
  const updatedLines = list.lines.map((l) =>
    l.id === line.id
      ? {
          ...l,
          status: "picked" as const,
          pickedQty: l.qty,
          pickedBy: session.handle || "floor",
          pickedAt: now,
        }
      : l
  );
  const allDone = updatedLines.every(
    (l) => l.status === "picked" || l.status === "not_found"
  );
  const next: PickList = {
    ...list,
    lines: updatedLines,
    status: allDone ? "picked" : "picking",
  };

  writeLists(orgId, {
    ...blob,
    lists: blob.lists.map((l) => (l.id === listId ? next : l)),
  });
  syncOrderStatusesFromList(orgId, next);

  logEvent({
    section: "orders",
    action: `Picked ${line.sku}`,
    resource: `Pick list ${listId}`,
    resourceHref: `/orders/pick-lists/${listId}`,
    entityId: line.id,
    detail: `Scan pick @ ${line.location}`,
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId,
  });

  return {
    ok: true,
    list: next,
    line: updatedLines.find((l) => l.id === line.id)!,
    message: `Picked ${line.sku} @ ${line.location}`,
  };
}

export function markLineNotFound(
  orgId: string,
  listId: string,
  lineId: string
): PickList | null {
  const blob = readLists(orgId);
  const list = blob.lists.find((l) => l.id === listId);
  if (!list) return null;
  const session = loadSession();
  const updatedLines = list.lines.map((l) =>
    l.id === lineId
      ? { ...l, status: "not_found" as const, pickedBy: session.handle || "floor" }
      : l
  );
  const allDone = updatedLines.every(
    (l) => l.status === "picked" || l.status === "not_found"
  );
  const next: PickList = {
    ...list,
    lines: updatedLines,
    status: allDone ? "picked" : "picking",
  };
  writeLists(orgId, {
    ...blob,
    lists: blob.lists.map((l) => (l.id === listId ? next : l)),
  });
  syncOrderStatusesFromList(orgId, next);
  return next;
}

export function confirmPack(
  orgId: string,
  listId: string
): { ok: true; list: PickList; message: string } | { ok: false; message: string } {
  const blob = readLists(orgId);
  const list = blob.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, message: "Pick list not found." };

  const pending = list.lines.filter((l) => l.status === "pending");
  if (pending.length) {
    return {
      ok: false,
      message: `${pending.length} line(s) still pending — scan or mark not found first.`,
    };
  }

  const session = loadSession();
  const now = new Date().toISOString();
  const next: PickList = {
    ...list,
    status: "packed",
    packedBy: session.handle || "floor",
    packedByName: session.name || session.handle || "Floor user",
    packedAt: now,
    lockedUntil: null,
  };

  writeLists(orgId, {
    ...blob,
    lists: blob.lists.map((l) => (l.id === listId ? next : l)),
  });
  syncOrderStatusesFromList(orgId, next);

  logEvent({
    section: "orders",
    action: `Packed pick list ${listId}`,
    resource: `${next.lines.filter((l) => l.status === "picked").length} items · ${next.packedBy}`,
    resourceHref: `/orders/pick-lists/${listId}`,
    entityId: listId,
    detail: "Pack confirm",
    user: session.handle || undefined,
    userName: session.name || undefined,
    orgId,
  });

  return {
    ok: true,
    list: next,
    message: `Packed by ${next.packedByName}. Orders marked fulfilled.`,
  };
}

export function pickListProgress(list: PickList) {
  const total = list.lines.length;
  const picked = list.lines.filter((l) => l.status === "picked").length;
  const notFound = list.lines.filter((l) => l.status === "not_found").length;
  const pending = list.lines.filter((l) => l.status === "pending").length;
  return { total, picked, notFound, pending };
}
