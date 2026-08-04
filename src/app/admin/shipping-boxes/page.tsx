"use client";

import { useState } from "react";
import { Button, EmptyState, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldLabel,
  SectionCard,
  ToggleRow,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminShippingBoxesPage() {
  const { state, persist, ready, saved } = useAdminIms();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    lengthIn: 12,
    widthIn: 10,
    heightIn: 8,
    weightOz: 4,
    scanSheet: false,
  });

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Shipping Boxes"]} />
      <AdminPageIntro
        title="Shipping Boxes"
        description="Preset carton dimensions for calculate-shipping and pack workflows."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            Add box
          </Button>
        }
      />
      {saved ? <p className="text-sm text-mustard">Saved.</p> : null}
      <SectionCard>
        {!state.shippingBoxes.length ? (
          <EmptyState
            title="No shipping boxes yet"
            description="Add a box with length, width, height, and tare weight."
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-semibold">Name</th>
                <th className="pb-2 font-semibold">L×W×H (in)</th>
                <th className="pb-2 font-semibold">Weight (oz)</th>
                <th className="pb-2 font-semibold">Scan sheet</th>
                <th className="pb-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.shippingBoxes.map((b) => (
                <tr key={b.id} className="border-b border-ink/5">
                  <td className="py-2.5 font-medium">{b.name}</td>
                  <td className="py-2.5 tabular-nums">
                    {b.lengthIn}×{b.widthIn}×{b.heightIn}
                  </td>
                  <td className="py-2.5 tabular-nums">{b.weightOz}</td>
                  <td className="py-2.5">{b.scanSheet ? "Yes" : "No"}</td>
                  <td className="py-2.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        persist(
                          {
                            ...state,
                            shippingBoxes: state.shippingBoxes.filter((x) => x.id !== b.id),
                          },
                          { action: "Deleted shipping box", resource: b.name }
                        )
                      }
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>

      {open ? (
        <SectionCard title="Add shipping box">
          <div className="grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Name</FieldLabel>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {(["lengthIn", "widthIn", "heightIn", "weightOz"] as const).map((k) => (
              <div key={k}>
                <FieldLabel>{k}</FieldLabel>
                <Input
                  className="mt-1"
                  type="number"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <ToggleRow
                label="Include on scan sheet"
                checked={form.scanSheet}
                onChange={(v) => setForm({ ...form, scanSheet: v })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              onClick={() => {
                if (!form.name.trim()) return;
                persist(
                  {
                    ...state,
                    shippingBoxes: [
                      { id: `box-${Date.now()}`, ...form, name: form.name.trim() },
                      ...state.shippingBoxes,
                    ],
                  },
                  { action: "Added shipping box", resource: form.name.trim() }
                );
                setOpen(false);
                setForm({
                  name: "",
                  lengthIn: 12,
                  widthIn: 10,
                  heightIn: 8,
                  weightOz: 4,
                  scanSheet: false,
                });
              }}
            >
              Save box
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
