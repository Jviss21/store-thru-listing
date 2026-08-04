"use client";

import { Input } from "@/components/ui";
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

export default function AdminImagesPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Images"]} />
      <AdminPageIntro
        title="Images"
        description="Watermark, crop defaults, and upload limits for product photos."
      />
      <SectionCard>
        <div className="max-w-xl space-y-4">
          <ToggleRow
            label="Add watermarks on channel upload"
            help="Watermarks will be added to images when uploaded to the channel."
            checked={state.images.watermarkEnabled}
            onChange={(v) => setState({ ...state, images: { ...state.images, watermarkEnabled: v } })}
          />
          <div>
            <FieldLabel>Default crop aspect</FieldLabel>
            <SelectField
              value={state.images.defaultAspect}
              onChange={(e) =>
                setState({
                  ...state,
                  images: {
                    ...state.images,
                    defaultAspect: e.target.value as typeof state.images.defaultAspect,
                  },
                })
              }
            >
              <option value="Custom">Custom</option>
              <option value="Square">Square</option>
              <option value="4:3">4:3</option>
              <option value="16:9">16:9</option>
            </SelectField>
          </div>
          <div>
            <FieldLabel>Max upload size (MB)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              min={1}
              value={state.images.maxUploadMb}
              onChange={(e) =>
                setState({
                  ...state,
                  images: { ...state.images, maxUploadMb: Number(e.target.value) || 1 },
                })
              }
            />
            <FieldHelp>Applies to floor photo stations and listing editors.</FieldHelp>
          </div>
          <SaveBar
            saved={saved}
            onSave={() => persist(state, { action: "Updated image settings", resource: "Images" })}
          />
        </div>
      </SectionCard>
    </div>
  );
}
