/**
 * GET /api/ebay/category-tree
 * Returns US eBay category tree meta + roots (and optional children / search).
 * Live mode uses Taxonomy API when EBAY_* keys exist; otherwise bundled snapshot.
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { getMarketplaceMode } from "@/lib/api/config";
import {
  getEbayTaxonomyClient,
  isEbayTaxonomyConfigured,
} from "@/lib/ebay/taxonomy-client";
import { getChildren, getCategoryPath, searchCategories } from "@/lib/ebay/category-tree";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const parentIdParam = url.searchParams.get("parentId");
  const search = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId")?.trim();

  const client = getEbayTaxonomyClient();
  const treeRes = await client.getTree();
  if (!treeRes.ok) {
    return NextResponse.json(treeRes, { status: 502 });
  }

  const index = client.getIndexSync();
  const mode = getMarketplaceMode();

  if (search) {
    return NextResponse.json({
      ok: true,
      data: {
        mode,
        taxonomyConfigured: isEbayTaxonomyConfigured(),
        meta: treeRes.data.meta,
        hits: searchCategories(index, search, 50),
      },
    });
  }

  if (categoryId) {
    const path = getCategoryPath(index, categoryId);
    const node = index.byId.get(categoryId);
    return NextResponse.json({
      ok: true,
      data: {
        mode,
        taxonomyConfigured: isEbayTaxonomyConfigured(),
        meta: treeRes.data.meta,
        node: node ?? null,
        path,
        children: getChildren(index, categoryId),
      },
    });
  }

  if (parentIdParam !== null) {
    const parentId = parentIdParam === "" || parentIdParam === "root" ? null : parentIdParam;
    return NextResponse.json({
      ok: true,
      data: {
        mode,
        taxonomyConfigured: isEbayTaxonomyConfigured(),
        meta: treeRes.data.meta,
        parentId,
        children: getChildren(index, parentId),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    data: {
      mode,
      taxonomyConfigured: isEbayTaxonomyConfigured(),
      meta: treeRes.data.meta,
      roots: treeRes.data.roots,
    },
  });
}
