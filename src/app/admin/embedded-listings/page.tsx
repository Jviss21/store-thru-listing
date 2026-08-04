"use client";

import { Badge, Button, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminEmbeddedListingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const e = state.embeddedListings;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Embedded Listings"]} />
      <AdminPageIntro
        title="Embedded Listings"
        description="Embed Hammoq listing widgets on partner storefronts. Activation stub for the pilot."
      />
      <SectionCard>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={e.activated ? "green" : "neutral"}>
            {e.activated ? "Activated" : "Not activated"}
          </Badge>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setState({
                ...state,
                embeddedListings: { ...e, activated: !e.activated },
              })
            }
          >
            {e.activated ? "Deactivate" : "Activate stub"}
          </Button>
        </div>
        <Textarea
          className="mt-4"
          value={e.notes}
          onChange={(ev) =>
            setState({
              ...state,
              embeddedListings: { ...e, notes: ev.target.value },
            })
          }
        />
        <div className="mt-4 rounded-xl border border-dashed border-ink/15 bg-mist/40 p-4 text-sm text-muted">
          <p className="font-semibold text-ink">Embed snippet (preview)</p>
          <pre className="mt-2 overflow-x-auto text-xs">{`<script src="https://embed.hammoq.example/listings.js" data-org="test-goodwill"></script>`}</pre>
        </div>
        <div className="mt-4">
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, {
                action: "Updated embedded listings stub",
                resource: "Embedded Listings",
              })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
