"use client";

import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
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
import {
  formatDonorBarcode,
  lastIssuedDonorSku,
  normalizeSkuPrefix,
  peekNextDonorSku,
  printSettingsForPreview,
  printSettingsForProfile,
  type AdminImsState,
  type PrintLabelFields,
  type PrintPreviewMode,
  type PrintProfile,
} from "@/lib/admin-ims";
import {
  buildDemoZpl,
  DEMO_LABEL,
  resolveLabelLines,
} from "@/lib/print-label";
import { barcodeStubBars } from "@/lib/sku";
import { cn } from "@/lib/utils";

type ManifestSettings = AdminImsState["manifests"];

const LABEL_FIELD_OPTIONS: { key: keyof PrintLabelFields; label: string }[] = [
  { key: "inventoryLocation", label: "Inventory location" },
  { key: "supplier", label: "Supplier name" },
  { key: "date", label: "Current date" },
  { key: "title", label: "Title" },
];

export default function AdminDonorItemCreationPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#print") {
      document.getElementById("print")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [ready]);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const m = state.manifests;
  const p = state.print;
  const lastSku = lastIssuedDonorSku(m);
  const nextSku = peekNextDonorSku(m);
  const nextBarcode = formatDonorBarcode(nextSku, m);

  function patchManifests(patch: Partial<ManifestSettings>) {
    setState({ ...state!, manifests: { ...state!.manifests, ...patch } });
  }

  function patchPrint(patch: Partial<AdminImsState["print"]>) {
    setState({ ...state!, print: { ...state!.print, ...patch } });
  }

  function setLabelField(key: keyof PrintLabelFields, on: boolean) {
    patchPrint({ labelFields: { ...p.labelFields, [key]: on } });
  }

  function setProfile(profile: PrintProfile) {
    setState({ ...state!, print: printSettingsForProfile(profile, p) });
  }

  function setPreview(mode: PrintPreviewMode) {
    setState({ ...state!, print: printSettingsForPreview(mode, p) });
  }

  const demoLines = resolveLabelLines(p.labelFields, DEMO_LABEL);
  const zplPreview = buildDemoZpl(p.labelFields, DEMO_LABEL);
  const profileLabel = p.activeProfile === "zebra" ? "Zebra (ZPL)" : "Dymo (PDF)";

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Donor Item Creation"]} />
      <AdminPageIntro
        title="Donor Item Creation"
        description="SKU/barcode defaults, label print for Dymo and Zebra, and rejection responses for floor donor intake."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/manifests">
              <Button type="button" variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" /> Open floor Donor Item Creation
              </Button>
            </Link>
            <Link href="/manifests/new">
              <Button type="button" variant="outline" size="sm">
                Manual donor create
              </Button>
            </Link>
            <Link href="/workflow">
              <Button type="button" variant="outline" size="sm">
                Item pipeline (floor view)
              </Button>
            </Link>
          </div>
        }
      />

      <SectionCard title="SKU & barcode">
        <p className="mb-4 text-sm text-muted">
          Floor Manual donor create at{" "}
          <Link href="/manifests/new" className="font-medium text-primary hover:underline">
            /manifests/new
          </Link>{" "}
          reads these defaults from this org&apos;s Admin IMS storage.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="sku-prefix">SKU prefix</FieldLabel>
            <Input
              id="sku-prefix"
              className="mt-1"
              value={m.skuPrefix}
              onChange={(e) => patchManifests({ skuPrefix: e.target.value.toUpperCase() })}
              placeholder="TG"
              maxLength={8}
            />
            <FieldHelp>Letters/digits only — e.g. TG → next SKU {nextSku}</FieldHelp>
          </div>
          <div>
            <FieldLabel htmlFor="barcode-format">Barcode format</FieldLabel>
            <SelectField
              id="barcode-format"
              value={m.barcodeFormat}
              onChange={(e) =>
                patchManifests({
                  barcodeFormat: e.target.value as ManifestSettings["barcodeFormat"],
                })
              }
            >
              <option value="same-as-sku">Same as SKU</option>
              <option value="prefix-dash-seq">Prefix-sequence (TG-100001)</option>
              <option value="code128-sku">Code 128 wrapper (C128:SKU)</option>
            </SelectField>
            <FieldHelp>Next barcode preview: {nextBarcode}</FieldHelp>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <ToggleRow
            label="Auto-generate SKU on create"
            help="When on, Manual donor create allocates the next SKU/barcode from this sequence."
            checked={m.autoGenerateSkuOnCreate}
            onChange={(v) => patchManifests({ autoGenerateSkuOnCreate: v })}
          />
          <ToggleRow
            label="Print barcode on create"
            help={`After a successful unit add, print using the active ${profileLabel} profile and label fields below.`}
            checked={m.printBarcodeOnCreate}
            onChange={(v) => patchManifests({ printBarcodeOnCreate: v })}
          />
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-ink/8 bg-mist/40 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Last issued
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink">{lastSku ?? "—"}</p>
            <p className="text-xs text-muted">Sequence {m.lastIssuedSequence}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Next to issue
            </p>
            <p className="mt-1 font-display text-xl font-bold text-ink">{nextSku}</p>
            <p className="text-xs text-muted">Barcode {nextBarcode}</p>
          </div>
        </div>
        <div className="mt-4">
          <FieldLabel htmlFor="last-seq">Last issued sequence</FieldLabel>
          <Input
            id="last-seq"
            type="number"
            className="mt-1 max-w-xs"
            min={0}
            value={m.lastIssuedSequence}
            onChange={(e) =>
              patchManifests({ lastIssuedSequence: Math.max(0, Number(e.target.value) || 0) })
            }
          />
          <FieldHelp>Advance or reset the counter if floor and Admin get out of sync.</FieldHelp>
        </div>
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(
                {
                  ...state,
                  manifests: {
                    ...state.manifests,
                    skuPrefix: normalizeSkuPrefix(state.manifests.skuPrefix),
                  },
                },
                {
                  action: "Updated donor SKU & barcode defaults",
                  resource: "Donor Item Creation",
                }
              )
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Label print (Dymo / Zebra)" className="scroll-mt-24" id="print">
        <p className="mb-4 text-sm text-muted">
          Configure label fields and which printer profile floor print-on-create uses. Dymo labels
          print as PDF/HTML; Zebra labels export ZPL.
        </p>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setProfile("dymo")}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition",
              p.activeProfile === "dymo"
                ? "border-ink bg-ink text-white shadow-card"
                : "border-ink/10 bg-mist/40 text-ink hover:border-ink/25"
            )}
          >
            <p className="text-sm font-bold">Dymo</p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                p.activeProfile === "dymo" ? "text-white/75" : "text-muted"
              )}
            >
              PDF / HTML label — desktop or LabelWriter-style print dialog
            </p>
          </button>
          <button
            type="button"
            onClick={() => setProfile("zebra")}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition",
              p.activeProfile === "zebra"
                ? "border-ink bg-ink text-white shadow-card"
                : "border-ink/10 bg-mist/40 text-ink hover:border-ink/25"
            )}
          >
            <p className="text-sm font-bold">Zebra</p>
            <p
              className={cn(
                "mt-0.5 text-xs",
                p.activeProfile === "zebra" ? "text-white/75" : "text-muted"
              )}
            >
              ZPL file — send to a Zebra thermal printer or driver
            </p>
          </button>
        </div>

        <ToggleRow
          label="Lister Connect"
          help="Allow floor stations to pull print jobs from this org."
          checked={p.listerConnect}
          onChange={(v) => patchPrint({ listerConnect: v })}
        />

        <div className="mt-4">
          <FieldLabel>Optional product and donor label fields</FieldLabel>
          <p className="mt-1 text-xs text-muted">
            A SKU is included on each label by default. This is the default label for Donor Item
            Creation and products. Adjust density by toggling fields.
          </p>
          <div className="mt-3 space-y-2">
            {LABEL_FIELD_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-ink/30 accent-[#f0b429]"
                  checked={p.labelFields[key]}
                  onChange={(e) => setLabelField(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 max-w-md">
          <FieldLabel htmlFor="preview-mode">Preview for</FieldLabel>
          <SelectField
            id="preview-mode"
            value={p.previewMode}
            onChange={(e) => setPreview(e.target.value as PrintPreviewMode)}
          >
            <option value="PDF">PDF (Dymo)</option>
            <option value="ZPL">ZPL (Zebra)</option>
          </SelectField>
          <FieldHelp>PDF and ZPL will render differently.</FieldHelp>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-ink p-4 text-white shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
            {p.previewMode === "ZPL" ? "ZPL (Zebra) preview" : "PDF (Dymo) preview"}
          </p>
          {p.previewMode === "ZPL" ? (
            <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-accent/95">
              {zplPreview}
            </pre>
          ) : (
            <div className="mt-3 mx-auto max-w-xs rounded-lg border-2 border-white/20 bg-white p-4 text-ink shadow-sm">
              <div className="mb-3 h-1.5 rounded-full bg-accent" />
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] font-bold uppercase leading-relaxed tracking-wide">
                  {demoLines.location ? (
                    <>
                      Location: {demoLines.location}
                      <br />
                    </>
                  ) : null}
                  {demoLines.supplier ? <>Supplier: {demoLines.supplier}</> : null}
                </div>
                {demoLines.date ? (
                  <span className="shrink-0 text-[11px] font-semibold">{demoLines.date}</span>
                ) : null}
              </div>
              {demoLines.title ? (
                <p className="mt-3 text-center text-sm font-semibold">{demoLines.title}</p>
              ) : null}
              <p className="mt-2 text-center font-mono text-sm tracking-wider" aria-hidden>
                {barcodeStubBars(DEMO_LABEL.sku)}
              </p>
              <p className="mt-1 text-center font-mono text-base font-extrabold tracking-wide">
                {demoLines.sku}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, {
                action: "Updated donor label print settings",
                resource: "Donor Item Creation",
              })
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="Default rejection responses">
        <p className="mb-4 text-sm text-muted">
          Shown to donor intake processors as quick options when rejecting an item during floor
          processing.
        </p>
        <ol className="space-y-2">
          {m.rejectionReasons.map((reason, idx) => (
            <li key={`${reason}-${idx}`} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs text-muted">{idx + 1}.</span>
              <Input
                value={reason}
                onChange={(e) => {
                  const rejectionReasons = [...m.rejectionReasons];
                  rejectionReasons[idx] = e.target.value;
                  patchManifests({ rejectionReasons });
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete reason"
                onClick={() =>
                  patchManifests({
                    rejectionReasons: m.rejectionReasons.filter((_, i) => i !== idx),
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-coral" />
              </Button>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-xs text-muted">{m.rejectionReasons.length + 1}.</span>
            <Input
              placeholder="Add rejection reason"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Add reason"
              onClick={() => {
                if (!draft.trim()) return;
                patchManifests({
                  rejectionReasons: [...m.rejectionReasons, draft.trim()],
                });
                setDraft("");
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </li>
        </ol>
        <div className="mt-5 space-y-2 border-t border-ink/8 pt-4">
          <p className="text-sm font-bold text-ink">Item preferences</p>
          <ToggleRow
            label="Require photos on accept"
            checked={m.requirePhotosOnAccept}
            onChange={(v) => patchManifests({ requirePhotosOnAccept: v })}
          />
          <ToggleRow
            label="Auto-assign processor"
            checked={m.autoAssignProcessor}
            onChange={(v) => patchManifests({ autoAssignProcessor: v })}
          />
        </div>
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, {
                action: "Updated donor rejection responses",
                resource: "Donor Item Creation",
              })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
