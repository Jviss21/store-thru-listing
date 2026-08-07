"use client";

import { useState } from "react";
import { Button, Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { BRAND } from "@/lib/mock-data";

const FIELD_OPTIONS = [
  "Images",
  "Category",
  "Listing Strategy",
  "SKU",
  "Supplier",
  "Weight",
  "Title",
  "Condition",
  "Dimensions",
];

export default function AdminProductsSettingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [tagName, setTagName] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const p = state.products;

  function toggleField(field: string) {
    const has = p.requiredPostingFields.includes(field);
    setState({
      ...state!,
      products: {
        ...p,
        requiredPostingFields: has
          ? p.requiredPostingFields.filter((f) => f !== field)
          : [...p.requiredPostingFields, field],
      },
    });
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Products"]} />
      <AdminPageIntro
        title="Products"
        description="Listing integrations, SKU generation, required posting fields, inventory rules, and tags."
      />

      <SectionCard title="Listing integrations">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-ink/10 p-4">
            <p className="font-display text-lg font-bold text-ink">{BRAND.product}</p>
            <p className="mt-1 text-sm text-muted">
              Import product images and attributes from the Hammoq API (Connect).
            </p>
            <Badge className="mt-3" tone={p.hammoqConnect === "Connected" ? "green" : "neutral"}>
              {p.hammoqConnect}
            </Badge>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              type="button"
              onClick={() =>
                setState({
                  ...state,
                  products: {
                    ...p,
                    hammoqConnect: p.hammoqConnect === "Connected" ? "Not Connected" : "Connected",
                  },
                })
              }
            >
              {p.hammoqConnect === "Connected" ? "Disconnect" : "Connect"}
            </Button>
          </div>
          <div className="rounded-xl border border-ink/10 p-4">
            <p className="font-display text-lg font-bold text-ink">Pearldive</p>
            <p className="mt-1 text-sm text-muted">
              Automatically generate and publish listings from photos (stub).
            </p>
            <Button className="mt-3" size="sm" type="button" variant="outline" disabled>
              Get Tokens
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="SKU generation">
        <FieldLabel>SKU type</FieldLabel>
        <SelectField
          value={p.skuType}
          onChange={(e) => setState({ ...state, products: { ...p, skuType: e.target.value } })}
        >
          <option value="Alphanumeric with Number Endings (default)">
            Alphanumeric with Number Endings (default)
          </option>
          <option value="Numeric only">Numeric only</option>
          <option value="Supplier + sequential">Supplier + sequential</option>
        </SelectField>
        <FieldHelp>
          SKUs begin with the supplier abbreviation and end with numbers for donor item batches.
        </FieldHelp>
        <div className="mt-4 rounded-xl border border-dashed border-ink/15 bg-mist/50 px-4 py-3 text-center">
          <p className="font-mono text-xs tracking-[0.3em] text-ink">||||| |||| |||||</p>
          <p className="mt-1 font-mono text-sm font-bold text-ink">RES167GD-01</p>
          <p className="mt-2 text-[10px] text-muted">
            Supplier Abbreviation · SKU Type (alphanumeric) · Ending (numbers)
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Default shipping method">
        <SelectField
          value={p.defaultShippingMethod}
          onChange={(e) =>
            setState({ ...state, products: { ...p, defaultShippingMethod: e.target.value } })
          }
        >
          <option>FedEx</option>
          <option>USPS</option>
          <option>UPS</option>
          <option>DHL Express</option>
        </SelectField>
      </SectionCard>

      <SectionCard title="Required posting fields">
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((f) => {
            const on = p.requiredPostingFields.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleField(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  on ? "bg-accent text-ink" : "bg-ink/5 text-muted hover:bg-ink/10"
                }`}
              >
                {f}
                {on ? " ×" : " +"}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Product inventory settings">
        <FieldLabel>Block draft products from reshelf</FieldLabel>
        <SelectField
          value={p.blockDraftReshelf ? "On" : "Off - (Default)"}
          onChange={(e) =>
            setState({
              ...state,
              products: { ...p, blockDraftReshelf: e.target.value === "On" },
            })
          }
        >
          <option>Off - (Default)</option>
          <option>On</option>
        </SelectField>
        <FieldHelp>Controls if users can add draft products to inventory using Reshelf.</FieldHelp>
      </SectionCard>

      <SectionCard
        title="Tags"
        className="space-y-3"
      >
        <div className="mb-3 flex gap-2">
          <Input
            placeholder="New tag"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              if (!tagName.trim()) return;
              setState({
                ...state,
                products: {
                  ...p,
                  tags: [
                    { id: `tg-${Date.now()}`, name: tagName.trim(), count: 0 },
                    ...p.tags,
                  ],
                },
              });
              setTagName("");
            }}
          >
            New tag
          </Button>
        </div>
        <ul className="divide-y divide-ink/5">
          {p.tags.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-semibold text-ink">{t.name}</span>
                <span className="ml-2 text-muted">{t.count} tagged products</span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={() =>
                  setState({
                    ...state,
                    products: { ...p, tags: p.tags.filter((x) => x.id !== t.id) },
                  })
                }
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SaveBar
        saved={saved}
        onSave={() => persist(state, { action: "Updated product settings", resource: "Products" })}
      />
    </div>
  );
}
