/**
 * Product repository — Prisma when DB ready; callers fall back to mock.
 */

import { prisma, isDbReady } from "@/lib/db/client";

export type ProductCreateInput = {
  orgId: string;
  sku: string;
  title: string;
  barcode?: string | null;
  status?: string;
  priceCents?: number;
  location?: string | null;
  supplier?: string | null;
  category?: string | null;
  description?: string | null;
  photos?: string[];
  tags?: string[];
  createdById?: string | null;
  manifestId?: string | null;
};

export type ProductDto = {
  id: string;
  orgId: string;
  sku: string;
  barcode: string | null;
  title: string;
  status: string;
  price: number;
  location: string | null;
  supplier: string | null;
  category: string | null;
  description: string | null;
  imageUrls: string[];
  tags: string[];
  createdById: string | null;
  manifestId: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function toDto(row: {
  id: string;
  orgId: string;
  sku: string;
  barcode: string | null;
  title: string;
  status: string;
  priceCents: number;
  location: string | null;
  supplier: string | null;
  category: string | null;
  description: string | null;
  photosJson: string | null;
  tagsJson: string | null;
  createdById: string | null;
  manifestId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductDto {
  return {
    id: row.id,
    orgId: row.orgId,
    sku: row.sku,
    barcode: row.barcode,
    title: row.title,
    status: row.status,
    price: row.priceCents / 100,
    location: row.location,
    supplier: row.supplier,
    category: row.category,
    description: row.description,
    imageUrls: parseJsonArray(row.photosJson),
    tags: parseJsonArray(row.tagsJson),
    createdById: row.createdById,
    manifestId: row.manifestId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProductsForOrg(
  orgId: string,
  opts?: { take?: number }
): Promise<ProductDto[] | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const rows = await prisma.product.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 500,
    });
    return rows.map(toDto);
  } catch {
    return null;
  }
}

export async function createProduct(
  input: ProductCreateInput
): Promise<ProductDto | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const row = await prisma.product.create({
      data: {
        orgId: input.orgId,
        sku: input.sku,
        title: input.title,
        barcode: input.barcode ?? input.sku,
        status: input.status ?? "Draft",
        priceCents: input.priceCents ?? 0,
        location: input.location ?? null,
        supplier: input.supplier ?? null,
        category: input.category ?? null,
        description: input.description ?? null,
        photosJson: input.photos?.length ? JSON.stringify(input.photos) : null,
        tagsJson: input.tags?.length ? JSON.stringify(input.tags) : null,
        createdById: input.createdById ?? null,
        manifestId: input.manifestId ?? null,
      },
    });
    return toDto(row);
  } catch {
    return null;
  }
}

export async function createProductsBatch(
  inputs: ProductCreateInput[]
): Promise<ProductDto[] | null> {
  if (!isDbReady() || !prisma) return null;
  if (inputs.length === 0) return [];
  try {
    const created: ProductDto[] = [];
    for (const input of inputs) {
      const row = await createProduct(input);
      if (!row) return null;
      created.push(row);
    }
    return created;
  } catch {
    return null;
  }
}

export type ProductPatchInput = {
  title?: string;
  status?: string;
  priceCents?: number;
  location?: string | null;
  supplier?: string | null;
  category?: string | null;
  description?: string | null;
  photos?: string[];
  tags?: string[];
  barcode?: string | null;
};

/** Patch product fields (tags/location/status) without breaking Neon when DB is down. */
export async function updateProduct(
  orgId: string,
  productId: string,
  patch: ProductPatchInput
): Promise<ProductDto | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const existing = await prisma.product.findFirst({
      where: { id: productId, orgId },
    });
    if (!existing) return null;
    const row = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.priceCents !== undefined ? { priceCents: patch.priceCents } : {}),
        ...(patch.location !== undefined ? { location: patch.location } : {}),
        ...(patch.supplier !== undefined ? { supplier: patch.supplier } : {}),
        ...(patch.category !== undefined ? { category: patch.category } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.barcode !== undefined ? { barcode: patch.barcode } : {}),
        ...(patch.photos !== undefined
          ? { photosJson: patch.photos.length ? JSON.stringify(patch.photos) : null }
          : {}),
        ...(patch.tags !== undefined
          ? { tagsJson: patch.tags.length ? JSON.stringify(patch.tags) : null }
          : {}),
      },
    });
    return toDto(row);
  } catch {
    return null;
  }
}

export async function findProductById(
  orgId: string,
  productId: string
): Promise<ProductDto | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const row = await prisma.product.findFirst({ where: { id: productId, orgId } });
    return row ? toDto(row) : null;
  } catch {
    return null;
  }
}
