"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/shipping/labels")
      .then((r) => r.json())
      .then((j: { easyPostConfigured?: boolean; message?: string }) => {
        setApiStatus({
          configured: Boolean(j.easyPostConfigured),
          message: j.message || "",
        });
      })
      .catch(() =>
        setApiStatus({
          configured: false,
          message: "Could not reach label API.",
        })
      );
  }, []);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const s = state.shipping;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Shipping"]} />
      <AdminPageIntro title="Shipping" description="Carrier accounts and pack/ship workflow toggles." />

      <SectionCard>
        {apiStatus && (
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              apiStatus.configured
                ? "border-mustard/30 bg-mustard/10 text-ink"
                : "border-ink/10 bg-mist/60 text-ink"
            }`}
          >
            {apiStatus.configured ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mustard" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
            )}
            <div>
              <p className="font-medium">
                {apiStatus.configured
                  ? "EASYPOST_API_KEY detected on server"
                  : "No EASYPOST_API_KEY — printable stub labels"}
              </p>
              <p className="mt-0.5 text-xs text-muted">{apiStatus.message}</p>
            </div>
          </div>
        )}
        {s.easyPostConnected ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-mustard/30 bg-mustard/10 px-4 py-3 text-sm text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mustard" />
            EasyPost Account Connected in Admin. Shipments → New shipment will purchase labels
            {apiStatus?.configured ? " via live EasyPost." : " (stub until API key is set)."}
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
        <FieldHelp>
          Toggle stores org preference. Live buy requires EASYPOST_API_KEY in env; without it,
          /shipments/new still generates printable SVG/PDF stubs and tracking.
        </FieldHelp>
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
