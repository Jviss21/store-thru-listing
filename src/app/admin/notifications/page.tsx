"use client";

import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldLabel,
  SaveBar,
  SectionCard,
  SelectField,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminNotificationsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const freq = state.notifications.digestFrequency;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Notifications"]} />
      <AdminPageIntro
        title="Notification Settings"
        description="Performance digest email cadence for managers and posters."
      />
      <SectionCard title="Notification Settings">
        <div className="max-w-xl space-y-4">
          <div>
            <FieldLabel>Performance Digest Email Frequency</FieldLabel>
            <SelectField
              value={freq}
              onChange={(e) =>
                setState({
                  ...state,
                  notifications: {
                    digestFrequency: e.target.value as typeof freq,
                  },
                })
              }
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Off">Off</option>
            </SelectField>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Preview</p>
            <div className="mt-2 overflow-hidden rounded-xl border border-ink/10">
              <div className="bg-ink px-4 py-5 text-white">
                <p className="text-center text-xs font-semibold text-white/70">Hammoq Lister</p>
                <p className="mt-3 font-display text-lg font-bold">Performance digest</p>
                <p className="text-xs text-white/60">July 27 — August 02 · {freq}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">201</p>
                    <p className="text-[10px] text-white/55">Total Postings</p>
                    <p className="text-[10px] text-mustard">+60%</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">$95,612</p>
                    <p className="text-[10px] text-white/55">Total Sales</p>
                    <p className="text-[10px] text-mustard">+10%</p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold tabular-nums">$46</p>
                    <p className="text-[10px] text-white/55">Avg Order Value</p>
                    <p className="text-[10px] text-coral">-23.6%</p>
                  </div>
                </div>
              </div>
              <div className="bg-white px-4 py-3">
                <p className="text-xs font-semibold text-ink">Top weekly posters</p>
                <ul className="mt-2 space-y-1 text-sm text-muted">
                  <li className="flex justify-between">
                    <span>jsmith</span>
                    <span className="tabular-nums">48</span>
                  </li>
                  <li className="flex justify-between">
                    <span>ajones</span>
                    <span className="tabular-nums">41</span>
                  </li>
                  <li className="flex justify-between">
                    <span>bwilson</span>
                    <span className="tabular-nums">36</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, {
                action: "Updated notification digest frequency",
                resource: "Notifications",
              })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
