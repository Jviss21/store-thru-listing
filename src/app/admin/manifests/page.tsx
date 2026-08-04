"use client";

import { Trash2, Plus } from "lucide-react";
import { Button, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SaveBar,
  SectionCard,
  ToggleRow,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { useState } from "react";

export default function AdminManifestsSettingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [draft, setDraft] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Manifests"]} />
      <AdminPageIntro
        title="Manifests"
        description="Default rejection responses shown to processors, plus intake preferences."
      />
      <SectionCard title="Default rejection responses">
        <p className="mb-4 text-sm text-muted">
          These will be shown to your processors as default options for their rejection reasons.
        </p>
        <ol className="space-y-2">
          {state.manifests.rejectionReasons.map((reason, idx) => (
            <li key={`${reason}-${idx}`} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-xs text-muted">{idx + 1}.</span>
              <Input
                value={reason}
                onChange={(e) => {
                  const rejectionReasons = [...state.manifests.rejectionReasons];
                  rejectionReasons[idx] = e.target.value;
                  setState({ ...state, manifests: { ...state.manifests, rejectionReasons } });
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete reason"
                onClick={() =>
                  setState({
                    ...state,
                    manifests: {
                      ...state.manifests,
                      rejectionReasons: state.manifests.rejectionReasons.filter((_, i) => i !== idx),
                    },
                  })
                }
              >
                <Trash2 className="h-4 w-4 text-coral" />
              </Button>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-xs text-muted">
              {state.manifests.rejectionReasons.length + 1}.
            </span>
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
                setState({
                  ...state,
                  manifests: {
                    ...state.manifests,
                    rejectionReasons: [...state.manifests.rejectionReasons, draft.trim()],
                  },
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
            checked={state.manifests.requirePhotosOnAccept}
            onChange={(v) =>
              setState({ ...state, manifests: { ...state.manifests, requirePhotosOnAccept: v } })
            }
          />
          <ToggleRow
            label="Auto-assign processor"
            checked={state.manifests.autoAssignProcessor}
            onChange={(v) =>
              setState({ ...state, manifests: { ...state.manifests, autoAssignProcessor: v } })
            }
          />
        </div>
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated manifest rejection responses", resource: "Manifests" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
