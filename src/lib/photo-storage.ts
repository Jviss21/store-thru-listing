/**
 * Durable product photo storage.
 *
 * Priority:
 * 1. Vercel Blob when BLOB_READ_WRITE_TOKEN is set
 * 2. Local filesystem under .data/photos (dev / non-Vercel)
 * 3. In-memory + base64 data-URL fallback (serverless without Blob)
 *
 * TODO: Prefer Neon Photo rows + object storage in production; photosJson on
 * Product is the interim DB-backed URL list when Prisma is available.
 */

import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type PhotoBackend = "vercel-blob" | "local-fs" | "memory" | "data-url";

export type StoredPhoto = {
  id: string;
  orgId: string;
  productId: string | null;
  contentType: string;
  /** Public or same-origin URL the client can use in <img src>. */
  url: string;
  storageKey: string;
  backend: PhotoBackend;
  bytes?: Buffer;
  createdAt: string;
};

type MemoryEntry = {
  orgId: string;
  productId: string | null;
  contentType: string;
  bytes: Buffer;
  createdAt: string;
};

const globalStore = globalThis as unknown as {
  __stlPhotoMemory?: Map<string, MemoryEntry>;
};

function memoryMap(): Map<string, MemoryEntry> {
  if (!globalStore.__stlPhotoMemory) {
    globalStore.__stlPhotoMemory = new Map();
  }
  return globalStore.__stlPhotoMemory;
}

function newId(): string {
  return `ph_${randomBytes(12).toString("hex")}`;
}

function dataDir(): string {
  return path.join(process.cwd(), ".data", "photos");
}

function canWriteLocalFs(): boolean {
  return !process.env.VERCEL;
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export async function storePhoto(input: {
  orgId: string;
  productId?: string | null;
  bytes: Buffer;
  contentType: string;
  filename?: string;
}): Promise<StoredPhoto> {
  const id = newId();
  const createdAt = new Date().toISOString();
  const productId = input.productId ?? null;
  const contentType = input.contentType || "image/jpeg";
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : contentType.includes("gif")
          ? "gif"
          : "jpg";

  if (blobConfigured()) {
    try {
      const { put } = await import("@vercel/blob");
      const key = `orgs/${input.orgId}/products/${productId ?? "unassigned"}/${id}.${ext}`;
      const result = await put(key, input.bytes, {
        access: "public",
        contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return {
        id,
        orgId: input.orgId,
        productId,
        contentType,
        url: result.url,
        storageKey: result.pathname || key,
        backend: "vercel-blob",
        createdAt,
      };
    } catch (err) {
      console.warn("[photo-storage] Vercel Blob put failed, falling back:", err);
    }
  }

  if (canWriteLocalFs()) {
    try {
      const dir = path.join(dataDir(), input.orgId);
      await fs.mkdir(dir, { recursive: true });
      const filename = `${id}.${ext}`;
      const filePath = path.join(dir, filename);
      await fs.writeFile(filePath, input.bytes);
      const storageKey = `${input.orgId}/${filename}`;
      return {
        id,
        orgId: input.orgId,
        productId,
        contentType,
        url: `/api/photos/${id}`,
        storageKey,
        backend: "local-fs",
        bytes: input.bytes,
        createdAt,
      };
    } catch (err) {
      console.warn("[photo-storage] local FS write failed:", err);
    }
  }

  // Serverless / ephemeral: keep in process memory and serve via /api/photos/[id].
  // Also expose data-URL so clients survive cold starts (localStorage overlay).
  memoryMap().set(id, {
    orgId: input.orgId,
    productId,
    contentType,
    bytes: input.bytes,
    createdAt,
  });

  return {
    id,
    orgId: input.orgId,
    productId,
    contentType,
    url: `/api/photos/${id}`,
    storageKey: `memory:${id}`,
    backend: "memory",
    bytes: input.bytes,
    createdAt,
    // Clients that want cold-start durability can also persist dataUrl via toDataUrl().
  };
}

/** Extra payload for memory/data-url backends. */
export function toDataUrl(contentType: string, bytes: Buffer): string {
  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

export async function readPhoto(id: string): Promise<{
  bytes: Buffer;
  contentType: string;
  orgId: string;
} | null> {
  const mem = memoryMap().get(id);
  if (mem) {
    return { bytes: mem.bytes, contentType: mem.contentType, orgId: mem.orgId };
  }

  if (canWriteLocalFs()) {
    try {
      const dir = dataDir();
      const entries = await fs.readdir(dir).catch(() => [] as string[]);
      for (const org of entries) {
        const orgDir = path.join(dir, org);
        const files = await fs.readdir(orgDir).catch(() => [] as string[]);
        const match = files.find((f) => f.startsWith(id + "."));
        if (match) {
          const bytes = await fs.readFile(path.join(orgDir, match));
          const ext = path.extname(match).slice(1).toLowerCase();
          const contentType =
            ext === "png"
              ? "image/png"
              : ext === "webp"
                ? "image/webp"
                : ext === "gif"
                  ? "image/gif"
                  : "image/jpeg";
          return { bytes, contentType, orgId: org };
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}
