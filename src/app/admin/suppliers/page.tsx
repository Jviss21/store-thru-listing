"use client";

import { useState } from "react";
import { Button, Input, Badge } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminSuppliersPage() {
  const { state, persist, saved, ready } = useAdminIms();
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  function add() {
    if (!name.trim() || !abbr.trim()) return;
    const next = {
      ...state!,
      suppliers: [
        {
          id: `sup-${Date.now()}`,
          name: name.trim(),
          abbreviation: abbr.trim().toUpperCase().slice(0, 4),
          active: true,
        },
        ...state!.suppliers,
      ],
    };
    persist(next, { action: "Added supplier", resource: name.trim() });
    setName("");
    setAbbr("");
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Suppliers"]} />
      <AdminPageIntro
        title="Suppliers"
        description="Source locations and donor streams. Abbreviations feed SKU generation."
      />
      <SectionCard>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Abbr"
            className="sm:w-28"
            value={abbr}
            onChange={(e) => setAbbr(e.target.value)}
          />
          <Button type="button" onClick={add}>
            Add supplier
          </Button>
          {saved ? <span className="self-center text-sm text-mustard">Saved.</span> : null}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Abbr</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.suppliers.map((s) => (
              <tr key={s.id} className="border-b border-ink/5">
                <td className="py-2.5 font-medium text-ink">{s.name}</td>
                <td className="py-2.5 font-mono text-xs">{s.abbreviation}</td>
                <td className="py-2.5">
                  <Badge tone={s.active ? "green" : "neutral"}>{s.active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="py-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      persist(
                        {
                          ...state,
                          suppliers: state.suppliers.map((x) =>
                            x.id === s.id ? { ...x, active: !x.active } : x
                          ),
                        },
                        { action: s.active ? "Deactivated supplier" : "Activated supplier", resource: s.name }
                      )
                    }
                  >
                    {s.active ? "Deactivate" : "Activate"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
