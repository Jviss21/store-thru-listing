"use client";

import { Plus, Settings2, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { useState } from "react";

export default function AdminCategoriesPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const filtered = state.categories.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Categories"]} />
      <AdminPageIntro
        title="Category Editor"
        description="Hierarchical categories for product intake and channel mapping."
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
                setState({
                  ...state,
                  categories: [
                    ...state.categories,
                    { id: `cat-${Date.now()}`, name: newName.trim(), parentId: null },
                  ],
                });
                setNewName("");
              }}
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          </div>
        }
      />
      <SectionCard>
        <Input
          className="mb-4 max-w-sm"
          placeholder="Search categories"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <ul className="space-y-2">
          {filtered.map((c) => {
            const depth = c.parentId ? 1 : 0;
            return (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-xl border border-ink/8 bg-white px-3 py-2"
                style={{ marginLeft: depth * 20 }}
              >
                <span className="text-muted">⋮⋮</span>
                <span className="flex-1 font-semibold text-ink">{c.name}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Add subcategory"
                  onClick={() => {
                    const name = prompt("Subcategory name");
                    if (!name?.trim()) return;
                    setState({
                      ...state,
                      categories: [
                        ...state.categories,
                        { id: `cat-${Date.now()}`, name: name.trim(), parentId: c.id },
                      ],
                    });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label="Settings">
                  <Settings2 className="h-4 w-4 text-muted" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete"
                  onClick={() =>
                    setState({
                      ...state,
                      categories: state.categories.filter(
                        (x) => x.id !== c.id && x.parentId !== c.id
                      ),
                    })
                  }
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
              persist(state, { action: "Updated categories", resource: "Category Editor" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
