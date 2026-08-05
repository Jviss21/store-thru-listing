/**
 * eBay Commerce Taxonomy category-tree shapes (simplified for app use).
 * Live responses from getCategoryTree map into EbayCategoryNode.
 */

export type EbayCategoryNode = {
  categoryId: string;
  categoryName: string;
  parentId: string | null;
  /** True when the node has no children (listable leaf). */
  leaf: boolean;
  children?: EbayCategoryNode[];
};

/** Compact on-disk row: [id, name, parentId|null, leaf 0|1] */
export type EbayCategoryFlatRow = [
  id: string,
  name: string,
  parentId: string | null,
  leaf: 0 | 1,
];

export type EbayCategoryTreePayload = {
  marketplaceId: string;
  categoryTreeId: string;
  source: string;
  version: string;
  generatedAt: string;
  note?: string;
  nodes: EbayCategoryFlatRow[];
};

export type EbayCategoryTreeMeta = {
  marketplaceId: string;
  categoryTreeId: string;
  source: "bundled" | "live-api" | "bundled-fallback";
  version: string;
  generatedAt: string;
  nodeCount: number;
  mode: "mock" | "live";
};
