import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { loadAdminIms } from "@/lib/admin-ims";
import { findSeedUserByEmail, roleForOrg } from "@/lib/db/seed-data";
import { SUPPLIERS } from "@/lib/mock-data";
import { preferDbWrites, dbMode } from "@/lib/db/domain";
import {
  createProduct,
  findProductBySkuOrBarcode,
  updateProduct,
  type ProductDto,
} from "@/lib/db/products";
import { prisma, isDbReady } from "@/lib/db/client";
import { blobConfigured, storePhoto, toDataUrl } from "@/lib/photo-storage";
import { recordAuditEvent } from "@/lib/db/audit";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const UNSHELVED_STATUS = "Unshelved";

type StationIdentity = {
  userId: string;
  email: string;
  orgId: string;
  role: string;
  isOps: boolean;
  membershipOrgIds: string[];
};

function corsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-photo-station-secret, x-photo-station-email, x-photo-station-org",
  };
}

function json(
  request: NextRequest,
  body: unknown,
  status = 200
): NextResponse {
  return NextResponse.json(body, { status, headers: corsHeaders(request) });
}

function stationSecretOk(request: NextRequest): boolean {
  const expected = process.env.PHOTO_STATION_SECRET?.trim();
  if (!expected) return false;
  const provided = request.headers.get("x-photo-station-secret")?.trim();
  return Boolean(provided && provided === expected);
}

async function resolveIdentity(request: NextRequest): Promise<StationIdentity | null> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      userId: session.user.id,
      email: session.user.email,
      orgId: session.user.orgId,
      role: session.user.role,
      isOps: session.user.isOps,
      membershipOrgIds: session.user.membershipOrgIds ?? [],
    };
  }

  if (!stationSecretOk(request)) return null;

  const email = request.headers.get("x-photo-station-email")?.trim().toLowerCase();
  const orgHeader = request.headers.get("x-photo-station-org")?.trim();
  if (!email || !email.includes("@")) return null;

  // Companion Photo WebApp already validated password via /api/auth/login.
  // Shared secret + email maps onto the same IMS seed/org identity.
  const seed = findSeedUserByEmail(email);
  const membershipOrgIds = seed?.memberships.map((m) => m.orgId) ?? [
    orgHeader || "org-test-goodwill",
  ];
  const orgId =
    orgHeader && (seed?.isOps || membershipOrgIds.includes(orgHeader))
      ? orgHeader
      : seed?.primaryOrgId || orgHeader || "org-test-goodwill";

  return {
    userId: seed?.id ?? `photo-station:${email}`,
    email: seed?.email ?? email,
    orgId,
    role: seed ? roleForOrg(seed, orgId) : "Photographer",
    isOps: Boolean(seed?.isOps),
    membershipOrgIds,
  };
}

function mergeUnshelvedTags(existing: string[] | undefined, barcode: string): string[] {
  const next = new Set(existing ?? []);
  next.add("unshelved");
  next.add("stage:photos");
  next.add(`barcode:${barcode}`);
  next.delete("stage:putaway");
  return Array.from(next);
}

async function attachPhotoBytes(opts: {
  orgId: string;
  productId: string;
  bytes: Buffer;
  contentType: string;
  filename: string;
}): Promise<{ url: string; storageKey: string; backend: string; dataUrl?: string }> {
  const stored = await storePhoto({
    orgId: opts.orgId,
    productId: opts.productId,
    bytes: opts.bytes,
    contentType: opts.contentType,
    filename: opts.filename,
  });

  if (isDbReady() && prisma) {
    try {
      const product = await prisma.product.findFirst({
        where: { id: opts.productId, orgId: opts.orgId },
      });
      if (product) {
        let urls: string[] = [];
        try {
          urls = product.photosJson ? (JSON.parse(product.photosJson) as string[]) : [];
          if (!Array.isArray(urls)) urls = [];
        } catch {
          urls = [];
        }
        urls.push(stored.url);
        await prisma.product.update({
          where: { id: product.id },
          data: { photosJson: JSON.stringify(urls) },
        });
        await prisma.photo.create({
          data: {
            orgId: opts.orgId,
            productId: product.id,
            storageKey: stored.storageKey || stored.url,
            sortOrder: urls.length - 1,
          },
        });
      }
    } catch (err) {
      console.warn("[photo-station] Prisma attach skipped:", err);
    }
  }

  return {
    url: stored.url,
    storageKey: stored.storageKey,
    backend: stored.backend,
    dataUrl:
      stored.backend === "memory" || stored.backend === "data-url"
        ? toDataUrl(opts.contentType, opts.bytes)
        : undefined,
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Photo WebApp intake — create or update a product as Unshelved with photos.
 * Auth: NextAuth session OR x-photo-station-secret + x-photo-station-email.
 *
 * Multipart fields:
 *  - sku (required) — exact printed IMS SKU / barcode value
 *  - barcode (optional; defaults to sku)
 *  - title (optional; defaults to sku)
 *  - supplier (optional)
 *  - location (optional; defaults empty for unshelved)
 *  - category (optional)
 *  - photos[] / file / photo (one or more image files)
 */
export async function POST(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (!identity) {
    return json(request, { ok: false, error: "Unauthorized" }, 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(request, { ok: false, error: "Invalid multipart body" }, 400);
  }

  const sku = String(form.get("sku") ?? "").trim();
  const barcode = String(form.get("barcode") ?? sku).trim() || sku;
  const title = String(form.get("title") ?? "").trim() || sku;
  const supplier = String(form.get("supplier") ?? "").trim() || null;
  const locationRaw = String(form.get("location") ?? "").trim();
  // Unshelved = not on a shelf yet. Empty location (not Receiving) signals that.
  const location = locationRaw || null;
  const category = String(form.get("category") ?? "").trim() || null;
  const orgId =
    String(form.get("orgId") ?? "").trim() || identity.orgId;

  if (!identity.isOps && !identity.membershipOrgIds.includes(orgId)) {
    return json(request, { ok: false, error: "Forbidden" }, 403);
  }

  if (!sku) {
    return json(request, { ok: false, error: "sku required (exact printed IMS barcode/SKU)" }, 400);
  }

  const files: File[] = [];
  let oversized: string | null = null;
  Array.from(form.entries()).forEach(([key, value]) => {
    if (!(value instanceof File)) return;
    if (!value.type.startsWith("image/")) return;
    if (value.size > MAX_BYTES) {
      oversized = `Image exceeds 8 MB: ${value.name || key}`;
      return;
    }
    if (key === "photos" || key === "file" || key === "photo" || key.startsWith("photo")) {
      files.push(value);
    }
  });
  if (oversized) {
    return json(request, { ok: false, error: oversized }, 400);
  }

  if (!preferDbWrites(orgId)) {
    return json(
      request,
      {
        ok: false,
        error: "Database unavailable — cannot sync Unshelved product to IMS",
        dbMode: dbMode(),
      },
      503
    );
  }

  let product: ProductDto | null = await findProductBySkuOrBarcode(orgId, barcode);
  if (!product && barcode !== sku) {
    product = await findProductBySkuOrBarcode(orgId, sku);
  }

  const tags = mergeUnshelvedTags(product?.tags, barcode);

  if (product) {
    product = await updateProduct(orgId, product.id, {
      status: UNSHELVED_STATUS,
      supplier: supplier ?? product.supplier,
      location,
      category: category ?? product.category,
      title: title || product.title,
      barcode,
      tags,
    });
  } else {
    product = await createProduct({
      orgId,
      sku,
      barcode,
      title,
      status: UNSHELVED_STATUS,
      supplier,
      location,
      category,
      tags,
      createdById: identity.userId,
    });
  }

  if (!product) {
    return json(request, { ok: false, error: "Could not create/update product" }, 500);
  }

  const uploaded: Array<{ url: string; storageKey: string; backend: string }> = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const ab = await file.arrayBuffer();
    const stored = await attachPhotoBytes({
      orgId,
      productId: product.id,
      bytes: Buffer.from(ab),
      contentType: file.type || "image/jpeg",
      filename: file.name || `photo-${i + 1}.jpg`,
    });
    uploaded.push({
      url: stored.url,
      storageKey: stored.storageKey,
      backend: stored.backend,
    });
  }

  // Refresh product so imageUrls reflect uploads.
  const refreshed =
    (await findProductBySkuOrBarcode(orgId, barcode)) ||
    (await findProductBySkuOrBarcode(orgId, sku)) ||
    product;

  void recordAuditEvent({
    orgId,
    userId: identity.userId,
    action: "photo_station.unshelved",
    meta: {
      sku,
      barcode,
      productId: refreshed.id,
      photos: uploaded.length,
      supplier,
      location,
      email: identity.email,
    },
  });

  return json(request, {
    ok: true,
    status: UNSHELVED_STATUS,
    source: "prisma",
    dbMode: dbMode(),
    blobConfigured: blobConfigured(),
    data: refreshed,
    uploaded,
  });
}

/** Catalog helpers for the Photo WebApp (suppliers, locations, SKU scheme). */
export async function GET(request: NextRequest) {
  const identity = await resolveIdentity(request);
  if (!identity) {
    return json(request, { ok: false, error: "Unauthorized" }, 401);
  }

  const orgId =
    request.nextUrl.searchParams.get("orgId")?.trim() || identity.orgId;
  if (!identity.isOps && !identity.membershipOrgIds.includes(orgId)) {
    return json(request, { ok: false, error: "Forbidden" }, 403);
  }

  const ims = loadAdminIms(orgId);
  const lookup = request.nextUrl.searchParams.get("lookup")?.trim();

  if (lookup) {
    const found = await findProductBySkuOrBarcode(orgId, lookup);
    return json(request, {
      ok: true,
      data: found,
      skuScheme: {
        prefix: ims.skuPrefix,
        barcodeFormat: ims.barcodeFormat,
        nextSku: `${ims.skuPrefix}-${(ims.lastIssuedSequence || 0) + 1}`,
        format: `${ims.skuPrefix}-{sequence}`,
        note: "Printed barcode must match Product.barcode (defaults to SKU).",
      },
    });
  }

  return json(request, {
    ok: true,
    orgId,
    suppliers: SUPPLIERS,
    locations: ims.inventoryLocations.map((l) => ({
      id: l.id,
      name: l.name,
      controlledInShop: l.controlledInShop,
    })),
    skuScheme: {
      prefix: ims.skuPrefix,
      barcodeFormat: ims.barcodeFormat,
      lastIssuedSequence: ims.lastIssuedSequence,
      nextSku: `${ims.skuPrefix}-${(ims.lastIssuedSequence || 0) + 1}`,
      format: `${ims.skuPrefix}-{sequence}`,
      example: `${ims.skuPrefix}-4801`,
      note: "Scan the exact Code 128 value printed by Donor Item Creation (usually same-as-sku).",
    },
    statuses: {
      unshelved: UNSHELVED_STATUS,
      draft: "Draft",
      active: "Active",
      recycled: "Recycled",
    },
  });
}
