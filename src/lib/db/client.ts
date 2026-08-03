/**
 * Prisma client singleton.
 * On Vercel without a writable SQLite / Postgres URL, Prisma may be unavailable —
 * callers should use isDbReady() and fall back to seed module / mock adapters.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  // Vercel serverless FS is read-only except /tmp — skip file: SQLite there
  if (url.startsWith("file:") && process.env.VERCEL) {
    return null;
  }
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    return null;
  }
}

export const prisma: PrismaClient | null =
  globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim()) && !isSqliteBlockedOnVercel();
}

function isSqliteBlockedOnVercel(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return Boolean(process.env.VERCEL && url.startsWith("file:"));
}

/** Soft check — Prisma client constructed and URL usable. */
export function isDbReady(): boolean {
  return prisma !== null && isDbConfigured();
}

export type DbMode = "prisma" | "seed-fallback";

export function dbMode(): DbMode {
  return isDbReady() ? "prisma" : "seed-fallback";
}
