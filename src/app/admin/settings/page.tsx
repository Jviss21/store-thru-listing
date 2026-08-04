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
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminGeneralSettingsPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();

  if (!ready || !state) return <p className="text-sm text-muted">Loading settings…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Settings"]} />
      <AdminPageIntro
        title="Settings"
        description="Org-wide defaults for timezone, locale, and support contact. Persists per org in this browser."
      />
      <SectionCard>
        <div className="space-y-4 max-w-xl">
          <div>
            <FieldLabel>Company name</FieldLabel>
            <Input
              className="mt-1"
              value={state.general.companyName}
              onChange={(e) =>
                setState({ ...state, general: { ...state.general, companyName: e.target.value } })
              }
            />
          </div>
          <div>
            <FieldLabel>Timezone</FieldLabel>
            <SelectField
              value={state.general.timezone}
              onChange={(e) =>
                setState({ ...state, general: { ...state.general, timezone: e.target.value } })
              }
            >
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="America/Denver">America/Denver</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/New_York">America/New_York</option>
            </SelectField>
            <FieldHelp>Use America/Los_Angeles for ShopGoodwill end times when possible.</FieldHelp>
          </div>
          <div>
            <FieldLabel>Default locale</FieldLabel>
            <Input
              className="mt-1"
              value={state.general.defaultLocale}
              onChange={(e) =>
                setState({ ...state, general: { ...state.general, defaultLocale: e.target.value } })
              }
            />
          </div>
          <div>
            <FieldLabel>Support email</FieldLabel>
            <Input
              className="mt-1"
              type="email"
              value={state.general.supportEmail}
              onChange={(e) =>
                setState({ ...state, general: { ...state.general, supportEmail: e.target.value } })
              }
            />
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated general settings", resource: "Admin settings" })
            }
          />
        </div>
      </SectionCard>
    </div>
  );
}
