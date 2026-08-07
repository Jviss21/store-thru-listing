/**
 * Manifest / DonorBatch repository.
 * Internal Prisma model name remains `Manifest`; user-facing copy is "Donor Item Creation".
 */

import { prisma, isDbReady } from "@/lib/db/client";
import { createProduct, type ProductDto } from "@/lib/db/products";

export type ManifestLineInput = {
  title: string;
  sku: string;
  barcode?: string;
};

export type ManifestCreateInput = {
  orgId: string;
  batchBarcode: string;
  supplier?: string | null;
  supplierId?: string | null;
  notes?: string | null;
  createdById?: string | null;
  lines: ManifestLineInput[];
};

export type ManifestDto = {
  id: string;
  orgId: string;
  batchBarcode: string;
  supplier: string | null;
  supplierId: string | null;
  notes: string | null;
  status: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  productCount: number;
  products: ProductDto[];
  lines: {
    id: string;
    title: string;
    sku: string;
    barcode: string | null;
    reviewStatus: string;
    productId: string | null;
  }[];
};

/**
 * Create a donor batch + unit products in one transaction-ish flow.
 * Returns null when DB unavailable or write fails (caller falls back to mock).
 */
export async function createManifestWithProducts(
  input: ManifestCreateInput
): Promise<ManifestDto | null> {
  if (!isDbReady() || !prisma) return null;
  if (!input.lines.length) return null;

  const code = input.batchBarcode.trim().toUpperCase();
  if (!code) return null;

  try {
    const manifest = await prisma.manifest.create({
      data: {
        orgId: input.orgId,
        batchBarcode: code,
        supplier: input.supplier ?? null,
        supplierId: input.supplierId ?? null,
        notes: input.notes?.trim() || null,
        status: "Created",
        createdById: input.createdById ?? null,
      },
    });

    const products: ProductDto[] = [];
    const lineRows: ManifestDto["lines"] = [];

    for (let i = 0; i < input.lines.length; i++) {
      const line = input.lines[i];
      const barcode = line.barcode?.trim() || line.sku;
      const product = await createProduct({
        orgId: input.orgId,
        sku: line.sku,
        title: line.title,
        barcode,
        status: "Draft",
        location: "Receiving",
        supplier: input.supplier ?? null,
        category: "General Merchandise",
        description: `${line.title} — donor intake via ${code}.`,
        tags: ["Donor", `batch:${code}`, `barcode:${barcode}`],
        createdById: input.createdById ?? null,
        manifestId: manifest.id,
      });
      if (!product) {
        // Best-effort cleanup of orphaned manifest
        await prisma.manifest.delete({ where: { id: manifest.id } }).catch(() => {});
        return null;
      }
      products.push(product);

      const ml = await prisma.manifestLine.create({
        data: {
          manifestId: manifest.id,
          productId: product.id,
          title: line.title,
          sku: line.sku,
          barcode,
          reviewStatus: "Draft product",
          sortOrder: i,
        },
      });
      lineRows.push({
        id: ml.id,
        title: ml.title,
        sku: ml.sku,
        barcode: ml.barcode,
        reviewStatus: ml.reviewStatus,
        productId: ml.productId,
      });
    }

    return {
      id: manifest.id,
      orgId: manifest.orgId,
      batchBarcode: manifest.batchBarcode,
      supplier: manifest.supplier,
      supplierId: manifest.supplierId,
      notes: manifest.notes,
      status: manifest.status,
      createdById: manifest.createdById,
      createdAt: manifest.createdAt.toISOString(),
      updatedAt: manifest.updatedAt.toISOString(),
      productCount: products.length,
      products,
      lines: lineRows,
    };
  } catch {
    return null;
  }
}

export async function getManifestById(
  orgId: string,
  id: string
): Promise<ManifestDto | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const row = await prisma.manifest.findFirst({
      where: { orgId, OR: [{ id }, { batchBarcode: id }] },
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        products: true,
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      orgId: row.orgId,
      batchBarcode: row.batchBarcode,
      supplier: row.supplier,
      supplierId: row.supplierId,
      notes: row.notes,
      status: row.status,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      productCount: row.products.length,
      products: row.products.map((p) => ({
        id: p.id,
        orgId: p.orgId,
        sku: p.sku,
        barcode: p.barcode,
        title: p.title,
        status: p.status,
        price: p.priceCents / 100,
        location: p.location,
        supplier: p.supplier,
        category: p.category,
        description: p.description,
        imageUrls: [],
        tags: [],
        createdById: p.createdById,
        manifestId: p.manifestId,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      lines: row.lines.map((l) => ({
        id: l.id,
        title: l.title,
        sku: l.sku,
        barcode: l.barcode,
        reviewStatus: l.reviewStatus,
        productId: l.productId,
      })),
    };
  } catch {
    return null;
  }
}

export async function listManifestsForOrg(
  orgId: string,
  take = 100
): Promise<ManifestDto[] | null> {
  if (!isDbReady() || !prisma) return null;
  try {
    const rows = await prisma.manifest.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        lines: { orderBy: { sortOrder: "asc" } },
        products: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      orgId: row.orgId,
      batchBarcode: row.batchBarcode,
      supplier: row.supplier,
      supplierId: row.supplierId,
      notes: row.notes,
      status: row.status,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      productCount: row.products.length,
      products: [],
      lines: row.lines.map((l) => ({
        id: l.id,
        title: l.title,
        sku: l.sku,
        barcode: l.barcode,
        reviewStatus: l.reviewStatus,
        productId: l.productId,
      })),
    }));
  } catch {
    return null;
  }
}
