"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { EbayCategoryTreePicker } from "@/components/ebay/EbayCategoryTreePicker";
import { getMarketplaceMode } from "@/lib/api/config";
import { useMemo, useState } from "react";

export default function AdminCategoriesPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const mode = useMemo(() => getMarketplaceMode(), []);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const ims = state;
  type OrgCategory = (typeof ims.categories)[number];

  const filtered = ims.categories.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase())
  );
  const selectedOrg =
    ims.categories.find((c) => c.id === selectedOrgId) ?? filtered[0] ?? null;

  function updateOrgCategory(id: string, patch: Partial<OrgCategory>) {
    setState({
      ...ims,
      categories: ims.categories.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Categories"]} />
      <AdminPageIntro
        title="Category Editor"
        description="Org intake categories mapped to eBay’s US taxonomy tree. Browse or search the full category hierarchy, then map a node to each org category."
        actions={
          <div className="flex gap-2">
            <Input
              className="w-44"
              placeholder="New category"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Button
              type="button"
              variant="accent"
              onClick={() => {
                if (!newName.trim()) return;
                const id = `cat-${Date.now()}`;
                setState({
                  ...state,
                  categories: [
                    ...state.categories,
                    {
                      id,
                      name: newName.trim(),
                      parentId: null,
                      ebayCategoryId: null,
                      ebayCategoryPath: null,
                    },
                  ],
                });
                setSelectedOrgId(id);
                setNewName("");
              }}
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </div>
        }
      />

      <p className="text-xs text-muted">
        Marketplace mode: <span className="font-semibold text-ink">{mode}</span>
        {mode === "mock"
          ? " — using bundled US eBay category tree (offline)."
          : " — live Taxonomy API when EBAY_CLIENT_ID/SECRET are set; otherwise bundled fallback."}{" "}
        Tree source notes in PILOT.md.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Org categories">
          <Input
            className="mb-4 max-w-sm"
            placeholder="Search org categories"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="space-y-2">
            {filtered.map((c) => {
              const depth = c.parentId ? 1 : 0;
              const active = selectedOrg?.id === c.id;
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    active
                      ? "border-accent/40 bg-accent/10"
                      : "border-ink/8 bg-white"
                  }`}
                  style={{ marginLeft: depth * 20 }}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setSelectedOrgId(c.id)}
                  >
                    <span className="block font-semibold text-ink">{c.name}</span>
                    {c.ebayCategoryPath ? (
                      <span className="block truncate text-xs text-muted">
                        eBay: {c.ebayCategoryPath}
                      </span>
                    ) : (
                      <span className="block text-xs text-muted">
                        No eBay mapping
                      </span>
                    )}
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Add subcategory"
                    onClick={() => {
                      const name = prompt("Subcategory name");
                      if (!name?.trim()) return;
                      const id = `cat-${Date.now()}`;
                      setState({
                        ...state,
                        categories: [
                          ...state.categories,
                          {
                            id,
                            name: name.trim(),
                            parentId: c.id,
                            ebayCategoryId: null,
                            ebayCategoryPath: null,
                          },
                        ],
                      });
                      setSelectedOrgId(id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Select for mapping"
                    onClick={() => setSelectedOrgId(c.id)}
                  >
                    <Settings2 className="h-4 w-4 text-muted" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => {
                      setState({
                        ...state,
                        categories: state.categories.filter(
                          (x) => x.id !== c.id && x.parentId !== c.id
                        ),
                      });
                      if (selectedOrgId === c.id) setSelectedOrgId(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-coral" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <SaveBar
              saved={saved}
              onSave={() =>
                persist(state, {
                  action: "Updated categories",
                  resource: "Category Editor",
                })
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="eBay taxonomy mapping">
          {selectedOrg ? (
            <div className="space-y-3">
              <div>
                <FieldLabel>Mapping for</FieldLabel>
                <p className="mt-1 font-semibold text-ink">{selectedOrg.name}</p>
                <FieldHelp>
                  Select a node in the eBay tree below. Leaves are preferred for
                  listing; parent nodes are fine for org routing.
                </FieldHelp>
              </div>
              {selectedOrg.ebayCategoryPath ? (
                <p className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm">
                  <span className="text-muted">Current: </span>
                  <span className="font-medium text-ink">
                    {selectedOrg.ebayCategoryPath}
                  </span>
                  <span className="ml-2 font-mono text-xs text-muted">
                    #{selectedOrg.ebayCategoryId}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="ml-2"
                    onClick={() =>
                      updateOrgCategory(selectedOrg.id, {
                        ebayCategoryId: null,
                        ebayCategoryPath: null,
                      })
                    }
                  >
                    Clear
                  </Button>
                </p>
              ) : null}
              <EbayCategoryTreePicker
                selectedId={selectedOrg.ebayCategoryId}
                onSelect={(sel) =>
                  updateOrgCategory(selectedOrg.id, {
                    ebayCategoryId: sel.categoryId,
                    ebayCategoryPath: sel.path,
                  })
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted">
              Select an org category to map it to eBay.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
