"use client";

import { Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldLabel,
  SaveBar,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminEbayChannelPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  const e = state.channels.ebay;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "eBay"]} />
      <AdminPageIntro
        title="eBay"
        description="Connected store accounts and default listing policies."
      />
      <SectionCard title="Accounts">
        <ul className="space-y-2">
          {e.accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-ink/8 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-ink">{a.name}</span>
              <Badge tone={a.status === "Connected" ? "green" : "orange"}>{a.status}</Badge>
            </li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Defaults">
        <div className="max-w-xl space-y-3">
          <div>
            <FieldLabel>Default duration</FieldLabel>
            <Input
              className="mt-1"
              value={e.defaultDuration}
              onChange={(ev) =>
                setState({
                  ...state,
                  channels: {
                    ...state.channels,
                    ebay: { ...e, defaultDuration: ev.target.value },
                  },
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Default handling days</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              value={e.defaultHandlingDays}
              onChange={(ev) =>
                setState({
                  ...state,
                  channels: {
                    ...state.channels,
                    ebay: { ...e, defaultHandlingDays: Number(ev.target.value) || 0 },
                  },
                })
              }
            />
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated eBay channel defaults", resource: "eBay" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
