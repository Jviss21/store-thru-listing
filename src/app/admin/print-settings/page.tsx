"use client";

import Link from "next/link";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  SelectField,
  ToggleRow,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { Button } from "@/components/ui";

const LABEL_FIELDS = ["SKU", "Location", "Supplier", "Title", "Channel", "Barcode"];

export default function AdminPrintSettingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const p = state.print;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Print settings"]} />
      <AdminPageIntro
        title="Print settings"
        description="Lister Connect, optional label fields, and PDF / Dymo preview mode."
        actions={
          <Link href="/admin/stations">
            <Button type="button" variant="outline">
              Printers & stations
            </Button>
          </Link>
        }
      />
      <SectionCard>
        <div className="max-w-xl space-y-4">
          <ToggleRow
            label="Lister Connect"
            help="Allow floor stations to pull print jobs from this org."
            checked={p.listerConnect}
            onChange={(v) => setState({ ...state, print: { ...p, listerConnect: v } })}
          />
          <div>
            <FieldLabel>Optional label fields</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {LABEL_FIELDS.map((f) => {
                const on = p.optionalLabelFields.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      on ? "bg-accent text-ink" : "bg-ink/5 text-muted"
                    }`}
                    onClick={() =>
                      setState({
                        ...state,
                        print: {
                          ...p,
                          optionalLabelFields: on
                            ? p.optionalLabelFields.filter((x) => x !== f)
                            : [...p.optionalLabelFields, f],
                        },
                      })
                    }
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <FieldLabel>Preview mode</FieldLabel>
            <SelectField
              value={p.previewMode}
              onChange={(e) =>
                setState({
                  ...state,
                  print: { ...p, previewMode: e.target.value as "PDF" | "Dymo" },
                })
              }
            >
              <option value="PDF">PDF</option>
              <option value="Dymo">Dymo</option>
            </SelectField>
            <FieldHelp>Demo preview only — no printer drivers required.</FieldHelp>
          </div>
          <div className="rounded-xl border border-dashed border-ink/15 bg-mist/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {p.previewMode} preview
            </p>
            <div className="mt-3 rounded-lg bg-white p-4 shadow-sm">
              <p className="font-mono text-xs">SKU-1008 · Cart-29</p>
              <p className="mt-1 text-sm font-semibold text-ink">Sony WH-1000XM4</p>
              <p className="mt-2 font-mono text-[10px] tracking-[0.25em]">||||| |||| |||||</p>
            </div>
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated print settings", resource: "Print settings" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
