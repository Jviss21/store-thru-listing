"use client";

import { shipments as seedShipments, orders } from "@/lib/mock-data";
import type { ListingChannel, Shipment, ShipmentStatus } from "@/lib/types";
import { logEvent } from "@/lib/event-log";
import { loadSession } from "@/lib/session";

export const SHIPMENTS_STORAGE_KEY = "test-goodwill-demo-shipments";

export type NewShipmentInput = {
  orderNumber: string;
  channel: ListingChannel;
  carrier: string;
  trackingNumber?: string;
  createdBy?: string;
  packedBy?: string;
  insurance?: number | null;
  fees?: number;
  cost?: number;
  status?: ShipmentStatus;
};

function readCreated(): Shipment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SHIPMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Shipment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCreated(rows: Shipment[]) {
  localStorage.setItem(SHIPMENTS_STORAGE_KEY, JSON.stringify(rows));
}

export function getCreatedShipments(): Shipment[] {
  return readCreated();
}

export function getAllShipments(): Shipment[] {
  const created = readCreated();
  return [...created, ...seedShipments];
}

function hexChunk(seed: number, len: number) {
  let n = Math.abs(seed * 2654435761) >>> 0;
  let out = "";
  while (out.length < len) {
    n = (n * 1664525 + 1013904223) >>> 0;
    out += n.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}

export function saveCreatedShipment(input: NewShipmentInput): Shipment {
  const created = readCreated();
  const n = created.length + 1;
  const now = Date.now();
  const matched = orders.find(
    (o) => o.orderNumber.toLowerCase() === input.orderNumber.trim().toLowerCase()
  );
  const shipmentNumber = String(390000000000 + (now % 100000000) + n);
  const channel = matched?.channel ?? input.channel;
  const seedNum = matched ? Number(matched.id.replace(/\D/g, "")) || n : n;
  const channelOrderId =
    channel === "eBay"
      ? `03-${String(15000 + seedNum).padStart(5, "0")}-${String(20000 + n).padStart(5, "0")}`
      : `SGW-${400000 + seedNum}`;
  const row: Shipment = {
    id: `local-s${now}-${n}`,
    shipmentNumber,
    orderId: matched?.id ?? `local-o${now}`,
    orderNumber: matched?.orderNumber ?? (input.orderNumber.trim() || `ORD-LOCAL-${n}`),
    channelOrderId,
    channel,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber?.trim() || shipmentNumber,
    easyPostId: `shp_${hexChunk(now + n, 32)}`,
    cost: input.cost ?? 8.45,
    fees: input.fees ?? 0.06,
    insurance: input.insurance ?? null,
    createdBy: input.createdBy ?? "jdoe",
    packedBy: input.packedBy ?? "jdoe",
    shippedAt: new Date().toISOString(),
    status: input.status ?? "Label created",
  };
  writeCreated([row, ...created]);
  const session = loadSession();
  logEvent({
    section: "shipments",
    action: `Created ${row.carrier} label`,
    resource: `Shipment ${row.shipmentNumber}`,
    resourceHref: "/shipments",
    user: input.createdBy || session.handle || undefined,
    userName: session.name || undefined,
    orgId: session.activeOrgId,
  });
  return row;
}

export function clearCreatedShipments() {
  localStorage.removeItem(SHIPMENTS_STORAGE_KEY);
}
