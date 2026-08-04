"use client";

import { Badge, Button, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminShopifyStubPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const s = state.channels.shopify;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Shopify"]} />
      <AdminPageIntro title="Shopify" description="Channel stub for pilot — activate when OAuth is ready." />
      <SectionCard>
        <div className="flex items-center gap-3">
          <Badge tone={s.activated ? "green" : "neutral"}>
            {s.activated ? "Activated" : "Not activated"}
          </Badge>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setState({
                ...state,
                channels: {
                  ...state.channels,
                  shopify: { ...s, activated: !s.activated },
                },
              })
            }
          >
            {s.activated ? "Deactivate" : "Activate stub"}
          </Button>
        </div>
        <Textarea
          className="mt-4"
          value={s.notes}
          onChange={(e) =>
            setState({
              ...state,
              channels: {
                ...state.channels,
                shopify: { ...s, notes: e.target.value },
              },
            })
          }
        />
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated Shopify stub", resource: "Shopify" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
