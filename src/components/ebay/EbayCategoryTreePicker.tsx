"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FolderTree, Search } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMarketplaceMode } from "@/lib/api/config";
import {
  getAncestorIds,
  getBundledCategoryIndex,
  getCategoryPath,
  getChildren,
  searchCategories,
  type CategoryIndex,
  type CategorySearchHit,
} from "@/lib/ebay/category-tree";
import type { EbayCategoryNode, EbayCategoryTreeMeta } from "@/lib/ebay/types";

export type EbayCategorySelection = {
  categoryId: string;
  categoryName: string;
  path: string;
  leaf: boolean;
};

type Props = {
  selectedId?: string | null;
  onSelect: (sel: EbayCategorySelection) => void;
  /** Prefer leaves for listing; admin can map any node. */
  preferLeaves?: boolean;
  className?: string;
  /** Compact height for embed in forms. */
  compact?: boolean;
};

/**
 * Browsable + searchable eBay US category tree.
 * Mock: bundled JSON. Live: same bundled index by default; meta reflects
 * Taxonomy API status from /api/ebay/category-tree when authenticated.
 */
export function EbayCategoryTreePicker({
  selectedId,
  onSelect,
  preferLeaves = false,
  className,
  compact = false,
}: Props) {
  const mode = useMemo(() => getMarketplaceMode(), []);
  const index: CategoryIndex = useMemo(
    () => getBundledCategoryIndex(mode),
    [mode]
  );
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [meta, setMeta] = useState<EbayCategoryTreeMeta>(index.meta);

  useEffect(() => {
    if (mode !== "live") return;
    let cancelled = false;
    void fetch("/api/ebay/category-tree")
      .then((r) => r.json())
      .then((json: { ok?: boolean; data?: { meta?: EbayCategoryTreeMeta } }) => {
        if (cancelled || !json?.ok || !json.data?.meta) return;
        setMeta(json.data.meta);
      })
      .catch(() => {
        /* keep bundled meta */
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    if (!selectedId) return;
    const ancestors = getAncestorIds(index, selectedId);
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const id of ancestors) {
        if (id !== selectedId) next.add(id);
      }
      return next;
    });
  }, [selectedId, index]);

  const hits: CategorySearchHit[] = useMemo(() => {
    if (!q.trim()) return [];
    return searchCategories(index, q, 50);
  }, [q, index]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function selectNode(node: EbayCategoryNode) {
    if (preferLeaves && !node.leaf) {
      toggle(node.categoryId);
      return;
    }
    onSelect({
      categoryId: node.categoryId,
      categoryName: node.categoryName,
      path: getCategoryPath(index, node.categoryId),
      leaf: node.leaf,
    });
  }

  function renderNode(node: EbayCategoryNode, depth: number) {
    const kids = getChildren(index, node.categoryId);
    const hasKids = kids.length > 0;
    const isOpen = expanded.has(node.categoryId);
    const isSelected = selectedId === node.categoryId;

    return (
      <li key={node.categoryId}>
        <div
          className={cn(
            "flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm hover:bg-ink/5",
            isSelected && "bg-accent/15 ring-1 ring-accent/40"
          )}
          style={{ paddingLeft: 4 + depth * 14 }}
        >
          {hasKids ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted hover:text-ink"
              aria-label={isOpen ? "Collapse" : "Expand"}
              onClick={() => toggle(node.categoryId)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="inline-block w-6 shrink-0" />
          )}
          <button
            type="button"
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              node.leaf ? "font-medium text-ink" : "text-ink/90",
              isSelected && "font-semibold"
            )}
            onClick={() => selectNode(node)}
          >
            {node.categoryName}
            {!node.leaf ? (
              <span className="ml-1 text-[10px] uppercase tracking-wide text-muted">
                ({kids.length})
              </span>
            ) : null}
          </button>
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {node.categoryId}
          </span>
        </div>
        {hasKids && isOpen ? (
          <ul className="m-0 list-none p-0">
            {kids.map((child) => renderNode(child, depth + 1))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <FolderTree className="h-3.5 w-3.5" />
        <span>
          eBay US · {meta.nodeCount.toLocaleString()} categories · {meta.source} ·{" "}
          {mode}
        </span>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-9"
          placeholder="Search eBay categories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {q.trim() ? (
        <ul
          className={cn(
            "overflow-y-auto rounded-xl border border-ink/10 bg-white",
            compact ? "max-h-56" : "max-h-[28rem]"
          )}
        >
          {hits.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted">No matches</li>
          ) : (
            hits.map((hit) => (
              <li key={hit.categoryId}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col gap-0.5 border-b border-ink/5 px-3 py-2 text-left text-sm hover:bg-ink/5",
                    selectedId === hit.categoryId && "bg-accent/15"
                  )}
                  onClick={() =>
                    onSelect({
                      categoryId: hit.categoryId,
                      categoryName: hit.categoryName,
                      path: hit.path,
                      leaf: hit.leaf,
                    })
                  }
                >
                  <span className="font-medium text-ink">{hit.categoryName}</span>
                  <span className="truncate text-xs text-muted">{hit.path}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <ul
          className={cn(
            "overflow-y-auto rounded-xl border border-ink/10 bg-white p-1",
            compact ? "max-h-56" : "max-h-[28rem]"
          )}
        >
          {index.roots.map((root) => renderNode(root, 0))}
        </ul>
      )}
    </div>
  );
}
