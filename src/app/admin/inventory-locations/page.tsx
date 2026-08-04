"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { Button, Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminInventoryLocationsPage() {
  const { state, persist, ready, saved } = useAdminIms();
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const rows = state.inventoryLocations.filter((l) =>
    l.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Inventory Locations"]} />
      <AdminPageIntro
        title="Inventory Locations"
        description="Bins, carts, and racks. Controlled-in-shop locations appear on floor pick lists."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFlash("Barcode PDF queued for all locations (demo).");
                setTimeout(() => setFlash(null), 2200);
              }}
            >
              <Printer className="h-4 w-4" />
              Print all barcodes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFlash("Import dialog stub — paste CSV in a later pass.");
                setTimeout(() => setFlash(null), 2200);
              }}
            >
              Import
            </Button>
          </div>
        }
      />
      {(flash || saved) && (
        <p className="text-sm text-mustard">{flash ?? "Saved."}</p>
      )}
      <SectionCard>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Location name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              if (!name.trim()) return;
              persist(
                {
                  ...state,
                  inventoryLocations: [
                    {
                      id: `loc-${Date.now()}`,
                      name: name.trim(),
                      createdAt: new Date().toISOString().slice(0, 10),
                      controlledInShop: true,
                    },
                    ...state.inventoryLocations,
                  ],
                },
                { action: "Added inventory location", resource: name.trim() }
              );
              setName("");
            }}
          >
            Add inventory location
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Created</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
            <tr>
              <th className="pb-3" colSpan={4}>
                <Input
                  className="max-w-xs"
                  placeholder="Search name"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-ink/5 odd:bg-mist/30">
                <td className="py-2.5 font-medium text-ink">{l.name}</td>
                <td className="py-2.5 text-muted">{l.createdAt}</td>
                <td className="py-2.5">
                  {l.controlledInShop ? (
                    <Badge tone="blue">Controlled in shop</Badge>
                  ) : (
                    <Badge tone="neutral">Open</Badge>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setFlash(`Barcode queued for ${l.name}`);
                        setTimeout(() => setFlash(null), 1800);
                      }}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        persist(
                          {
                            ...state,
                            inventoryLocations: state.inventoryLocations.map((x) =>
                              x.id === l.id
                                ? { ...x, controlledInShop: !x.controlledInShop }
                                : x
                            ),
                          },
                          { action: "Toggled location control", resource: l.name }
                        )
                      }
                    >
                      Toggle
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
