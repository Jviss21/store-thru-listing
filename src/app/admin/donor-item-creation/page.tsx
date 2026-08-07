"use client";

import Link from "next/link";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
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
import { SectionEventLog } from "@/components/SectionEventLog";
import {
  formatDonorBarcode,
  lastIssuedDonorSku,
  normalizeSkuPrefix,
  peekNextDonorSku,
  type AdminImsState,
} from "@/lib/admin-ims";
import { useState } from "react";

type ManifestSettings = AdminImsState["manifests"];

export default function AdminDonorItemCreationPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [draft, setDraft] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const m = state.manifests;
  const lastSku = lastIssuedDonorSku(m);
  const nextSku = peekNextDonorSku(m);
  const nextBarcode = formatDonorBarcode(nextSku, m);

  function patchManifests(patch: Partial<ManifestSettings>) {
    setState({ ...state!, manifests: { ...state!.manifests, ...patch } });
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Donor Item Creation"]} />
      <AdminPageIntro
        title="Donor Item Creation"
        description="Settings for floor donor intake — rejection reasons for processors, and SKU/barcode defaults used when creating donor items."
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
          </div>
        }
      />

      <SectionCard title="SKU & barcode">
        <p className="mb-4 text-sm text-muted">
          Floor Manual donor create at{" "}
          <Link href="/manifests/new" className="font-medium text-primary hover:underline">
            /manifests/new
          </Link>{" "}
          reads these defaults from this org&apos;s Admin IMS storage (
          <code className="rounded bg-mist px-1 text-xs">stl-admin-ims</code>).
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
            help="Downloads a barcode sheet text file after a successful donor create save."
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

      <SectionEventLog section="admin" title="Donor Item Creation activity" />
    </div>
  );
}
