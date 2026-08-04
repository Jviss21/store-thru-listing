"use client";

import { Badge, Button, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminGoodwillFindsStubPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const g = state.channels.goodwillfinds;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "GoodwillFinds"]} />
      <AdminPageIntro
        title="GoodwillFinds"
        description="Partner channel stub — activate when API credentials are configured."
      />
      <SectionCard>
        <div className="flex items-center gap-3">
          <Badge tone={g.activated ? "green" : "neutral"}>
            {g.activated ? "Activated" : "Not activated"}
          </Badge>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setState({
                ...state,
                channels: {
                  ...state.channels,
                  goodwillfinds: { ...g, activated: !g.activated },
                },
              })
            }
          >
            {g.activated ? "Deactivate" : "Activate stub"}
          </Button>
        </div>
        <Textarea
          className="mt-4"
          value={g.notes}
          onChange={(e) =>
            setState({
              ...state,
              channels: {
                ...state.channels,
                goodwillfinds: { ...g, notes: e.target.value },
              },
            })
          }
        />
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated GoodwillFinds stub", resource: "GoodwillFinds" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
