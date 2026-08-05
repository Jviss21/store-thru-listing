/**
 * eBay category taxonomy client — mock uses bundled US tree; live hits
 * Commerce Taxonomy when EBAY_CLIENT_ID + EBAY_CLIENT_SECRET are set.
 */

import type { ApiResult } from "@/lib/api/types";
import { getMarketplaceMode } from "@/lib/api/config";
import {
  flattenTaxonomyApiTree,
  getBundledCategoryIndex,
  getCategoryPath,
  getChildren,
  getNode,
  indexFromPayload,
  listLeafOptions,
  searchCategories,
  type CategoryIndex,
  type CategorySearchHit,
} from "./category-tree";
import type { EbayCategoryNode, EbayCategoryTreeMeta } from "./types";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail<T = never>(error: string, code?: string): ApiResult<T> {
  return { ok: false, error, code };
}

export type EbayTaxonomyTreeResult = {
  meta: EbayCategoryTreeMeta;
  roots: EbayCategoryNode[];
};

export interface EbayTaxonomyClient {
  getTree(): Promise<ApiResult<EbayTaxonomyTreeResult>>;
  getChildren(parentId: string | null): Promise<ApiResult<EbayCategoryNode[]>>;
  getPath(categoryId: string): Promise<ApiResult<string>>;
  search(query: string, limit?: number): Promise<ApiResult<CategorySearchHit[]>>;
  listLeaves(limit?: number): Promise<
    ApiResult<{ id: string; path: string; leafName: string; parentId?: string }[]>
  >;
  /** Sync index for UI that already loaded the tree. */
  getIndexSync(): CategoryIndex;
}

function ebayCredentialsPresent(): boolean {
  return Boolean(
    process.env.EBAY_CLIENT_ID?.trim() && process.env.EBAY_CLIENT_SECRET?.trim()
  );
}

function apiHost(): string {
  const env = (process.env.EBAY_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.ebay.com"
    : "https://api.sandbox.ebay.com";
}

async function fetchAppToken(): Promise<string | null> {
  const clientId = process.env.EBAY_CLIENT_ID?.trim();
  const clientSecret = process.env.EBAY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${apiHost()}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function fetchLiveCategoryIndex(): Promise<CategoryIndex | null> {
  const token = await fetchAppToken();
  if (!token) return null;
  const treeIdRes = await fetch(
    `${apiHost()}/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    }
  );
  if (!treeIdRes.ok) return null;
  const treeIdJson = (await treeIdRes.json()) as { categoryTreeId?: string };
  const treeId = treeIdJson.categoryTreeId ?? "0";
  const treeRes = await fetch(
    `${apiHost()}/commerce/taxonomy/v1/category_tree/${encodeURIComponent(treeId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    }
  );
  if (!treeRes.ok) return null;
  const apiJson = await treeRes.json();
  const payload = flattenTaxonomyApiTree(apiJson);
  return indexFromPayload(payload, "live-api", "live");
}

export class MockEbayTaxonomyClient implements EbayTaxonomyClient {
  private index = getBundledCategoryIndex("mock");

  getIndexSync(): CategoryIndex {
    return this.index;
  }

  async getTree(): Promise<ApiResult<EbayTaxonomyTreeResult>> {
    return ok({ meta: this.index.meta, roots: this.index.roots });
  }

  async getChildren(
    parentId: string | null
  ): Promise<ApiResult<EbayCategoryNode[]>> {
    return ok(getChildren(this.index, parentId));
  }

  async getPath(categoryId: string): Promise<ApiResult<string>> {
    const node = getNode(this.index, categoryId);
    if (!node) return fail(`Unknown category ${categoryId}`, "UNKNOWN_CATEGORY");
    return ok(getCategoryPath(this.index, categoryId));
  }

  async search(
    query: string,
    limit = 40
  ): Promise<ApiResult<CategorySearchHit[]>> {
    return ok(searchCategories(this.index, query, limit));
  }

  async listLeaves(limit?: number) {
    return ok(listLeafOptions(this.index, limit));
  }
}

/**
 * Live client: tries Taxonomy API on first getTree(); caches result.
 * Falls back to bundled tree if credentials missing or request fails.
 */
export class LiveEbayTaxonomyClient implements EbayTaxonomyClient {
  private index: CategoryIndex = getBundledCategoryIndex("live");
  private loaded = false;

  getIndexSync(): CategoryIndex {
    return this.index;
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    this.loaded = true;
    if (!ebayCredentialsPresent()) return;
    try {
      const live = await fetchLiveCategoryIndex();
      if (live && live.byId.size > 0) this.index = live;
    } catch {
      // keep bundled fallback
    }
  }

  async getTree(): Promise<ApiResult<EbayTaxonomyTreeResult>> {
    await this.ensureLoaded();
    return ok({ meta: this.index.meta, roots: this.index.roots });
  }

  async getChildren(
    parentId: string | null
  ): Promise<ApiResult<EbayCategoryNode[]>> {
    await this.ensureLoaded();
    return ok(getChildren(this.index, parentId));
  }

  async getPath(categoryId: string): Promise<ApiResult<string>> {
    await this.ensureLoaded();
    const node = getNode(this.index, categoryId);
    if (!node) return fail(`Unknown category ${categoryId}`, "UNKNOWN_CATEGORY");
    return ok(getCategoryPath(this.index, categoryId));
  }

  async search(
    query: string,
    limit = 40
  ): Promise<ApiResult<CategorySearchHit[]>> {
    await this.ensureLoaded();
    return ok(searchCategories(this.index, query, limit));
  }

  async listLeaves(limit?: number) {
    await this.ensureLoaded();
    return ok(listLeafOptions(this.index, limit));
  }
}

let taxonomyClient: EbayTaxonomyClient | null = null;

export function getEbayTaxonomyClient(): EbayTaxonomyClient {
  if (!taxonomyClient) {
    taxonomyClient =
      getMarketplaceMode() === "live"
        ? new LiveEbayTaxonomyClient()
        : new MockEbayTaxonomyClient();
  }
  return taxonomyClient;
}

export function setEbayTaxonomyClient(client: EbayTaxonomyClient) {
  taxonomyClient = client;
}

/** Whether live Taxonomy API credentials are configured (server-only check). */
export function isEbayTaxonomyConfigured(): boolean {
  return ebayCredentialsPresent();
}
