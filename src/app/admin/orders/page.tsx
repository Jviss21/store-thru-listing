"use client";

import { Input, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  ToggleRow,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminOrdersSettingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const o = state.orders;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Orders"]} />
      <AdminPageIntro
        title="Orders"
        description="Fulfillment defaults: archive, packing slips, box selection, and picking profiles."
      />
      <SectionCard>
        <div className="max-w-xl space-y-4">
          <div>
            <FieldLabel>Auto-archive completed orders (days)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              min={0}
              value={o.autoArchiveDays}
              onChange={(e) =>
                setState({
                  ...state,
                  orders: { ...o, autoArchiveDays: Number(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Packing slip header</FieldLabel>
            <Textarea
              className="mt-1"
              value={o.packingSlipHeader}
              onChange={(e) =>
                setState({ ...state, orders: { ...o, packingSlipHeader: e.target.value } })
              }
            />
          </div>
          <div>
            <FieldLabel>Packing slip footer</FieldLabel>
            <Textarea
              className="mt-1"
              value={o.packingSlipFooter}
              onChange={(e) =>
                setState({ ...state, orders: { ...o, packingSlipFooter: e.target.value } })
              }
            />
          </div>
          <ToggleRow
            label="Require box selection before label"
            help="Packers must choose a shipping box before purchasing a rate."
            checked={o.requireBoxSelection}
            onChange={(v) => setState({ ...state, orders: { ...o, requireBoxSelection: v } })}
          />
        </div>
      </SectionCard>
      <SectionCard title="Picking profiles">
        <ul className="divide-y divide-ink/5">
          {o.pickingProfiles.map((p) => (
            <li key={p.id} className="py-1">
              <ToggleRow
                label={p.name}
                help={p.active ? "Active" : "Inactive"}
                checked={p.active}
                onChange={(v) =>
                  setState({
                    ...state,
                    orders: {
                      ...o,
                      pickingProfiles: o.pickingProfiles.map((x) =>
                        x.id === p.id ? { ...x, active: v } : x
                      ),
                    },
                  })
                }
              />
            </li>
          ))}
        </ul>
        <FieldHelp>Profiles drive pick-list filters on the Orders floor view.</FieldHelp>
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated order settings", resource: "Orders" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
