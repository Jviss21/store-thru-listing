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

export default function AdminItemAuthPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Item Authentication"]} />
      <AdminPageIntro
        title="Item Authentication"
        description="Hold rules for luxury and authenticated inventory before Auto-List publish."
      />
      <SectionCard>
        <div className="max-w-xl space-y-4">
          <ToggleRow
            label="Require authentication for luxury brands"
            help="Routes matching categories into Additional QA Required."
            checked={state.itemAuth.requireAuthForLuxury}
            onChange={(v) =>
              setState({ ...state, itemAuth: { ...state.itemAuth, requireAuthForLuxury: v } })
            }
          />
          <div>
            <FieldLabel>Auth confidence hold threshold (%)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={100}
              value={state.itemAuth.authHoldThreshold}
              onChange={(e) =>
                setState({
                  ...state,
                  itemAuth: {
                    ...state.itemAuth,
                    authHoldThreshold: Number(e.target.value) || 0,
                  },
                })
              }
            />
            <FieldHelp>Items below this confidence stay held for human review.</FieldHelp>
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={state.itemAuth.notes}
              onChange={(e) =>
                setState({ ...state, itemAuth: { ...state.itemAuth, notes: e.target.value } })
              }
            />
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated item authentication", resource: "Item Authentication" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
