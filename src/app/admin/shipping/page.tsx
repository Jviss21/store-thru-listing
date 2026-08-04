"use client";

import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui";
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

export default function AdminShippingPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const s = state.shipping;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Shipping"]} />
      <AdminPageIntro title="Shipping" description="Carrier accounts and pack/ship workflow toggles." />

      <SectionCard>
        {s.easyPostConnected ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-mustard/30 bg-mustard/10 px-4 py-3 text-sm text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mustard" />
            EasyPost Account Connected. Your carrier accounts are listed below.
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {s.carriers.map((c) => (
            <div key={c.name} className="rounded-xl border border-ink/10 p-4">
              <p className="text-sm font-semibold text-ink">{c.name}</p>
              <p className="mt-1 text-xs text-muted">Last Updated: {c.lastUpdated}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-coral hover:underline"
          onClick={() =>
            setState({ ...state, shipping: { ...s, easyPostConnected: !s.easyPostConnected } })
          }
        >
          {s.easyPostConnected ? "Disconnect my EasyPost account" : "Connect EasyPost"}
        </button>
      </SectionCard>

      <SectionCard>
        <div className="max-w-xl space-y-3">
          <ToggleRow
            label="Require packing before shipping"
            help="Ensures the packing workflow is used before creating a shipping label."
            checked={s.requirePacking}
            onChange={(v) => setState({ ...state, shipping: { ...s, requirePacking: v } })}
          />
          <ToggleRow
            label="Auto-select best rate"
            help="Automatically select the best rate in quick-ship."
            checked={s.autoSelectBestRate}
            onChange={(v) => setState({ ...state, shipping: { ...s, autoSelectBestRate: v } })}
          />
          <ToggleRow
            label="Auto-select packer"
            help="Select the current user as shipment packer when Pack Mode is not used."
            checked={s.autoSelectPacker}
            onChange={(v) => setState({ ...state, shipping: { ...s, autoSelectPacker: v } })}
          />
          <ToggleRow
            label="Auto-require signature"
            help="If order subtotal is greater than or equal to the threshold, require a signature."
            checked={s.autoRequireSignature}
            onChange={(v) => setState({ ...state, shipping: { ...s, autoRequireSignature: v } })}
          />
          <div>
            <FieldLabel>Signature threshold ($)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              value={s.signatureThreshold}
              onChange={(e) =>
                setState({
                  ...state,
                  shipping: { ...s, signatureThreshold: Number(e.target.value) || 0 },
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Shipsurance insurance threshold ($)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              value={s.insuranceThreshold}
              onChange={(e) =>
                setState({
                  ...state,
                  shipping: { ...s, insuranceThreshold: Number(e.target.value) || 0 },
                })
              }
            />
            <FieldHelp>
              Purchase insurance for any shipment above this amount. Leave at $100 to use free USPS /
              FedEx coverage where available.
            </FieldHelp>
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated shipping settings", resource: "Shipping" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
