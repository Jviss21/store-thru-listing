"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AccountEditForm,
  teammateToForm,
  type AccountFormValues,
} from "@/components/admin/AccountEditForm";
import { AdminPageIntro } from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";
import { Button } from "@/components/ui";
import { saveDemoSettings, loadDemoSettings } from "@/lib/demo-settings";
import { logEvent } from "@/lib/event-log";

export default function AccountSettingsPage() {
  const { session, updateSession, isOps } = useOrg();
  const { state, persist, ready, orgId } = useAdminIms();
  const [bootKey, setBootKey] = useState(0);

  const self = useMemo(() => {
    if (!state) return null;
    return (
      state.teammates.find(
        (t) =>
          t.email.toLowerCase() === session.email.toLowerCase() ||
          t.handle.toLowerCase() === session.handle.toLowerCase()
      ) ?? null
    );
  }, [state, session.email, session.handle]);

  const initial = useMemo((): AccountFormValues => {
    if (self) return teammateToForm(self);
    return {
      name: session.name,
      handle: session.handle,
      email: session.email,
      password: "",
      role: (session.role as AccountFormValues["role"]) || "Viewer",
      supplierId: null,
      sgwUsername: session.handle,
      sgwPassword: "",
      loginEnabled: true,
    };
  }, [self, session]);

  useEffect(() => {
    setBootKey((k) => k + 1);
  }, [initial.name, initial.email, initial.handle, ready]);

  if (!ready || !state) return <p className="text-sm text-muted">Loading account…</p>;

  function save(values: AccountFormValues) {
    if (self) {
      persist(
        {
          ...state!,
          teammates: state!.teammates.map((t) =>
            t.id === self.id
              ? {
                  ...t,
                  name: values.name,
                  handle: values.handle,
                  email: values.email,
                  role: values.role,
                  supplierId: values.supplierId,
                  sgwUsername: values.sgwUsername,
                  sgwPasswordSet: values.sgwPassword ? true : t.sgwPasswordSet,
                  loginEnabled: values.loginEnabled,
                  passwordHintSet: values.password ? true : t.passwordHintSet,
                  status: values.loginEnabled
                    ? t.status === "Deactivated"
                      ? "Active"
                      : t.status
                    : "Deactivated",
                }
              : t
          ),
        },
        { action: "Updated own account", resource: values.handle }
      );
    } else {
      persist(
        {
          ...state!,
          teammates: [
            {
              id: `u-self-${Date.now()}`,
              name: values.name,
              email: values.email,
              handle: values.handle,
              role: values.role,
              status: "Active",
              lastActiveAt: new Date().toISOString(),
              online: true,
              supplierId: values.supplierId,
              sgwUsername: values.sgwUsername,
              sgwPasswordSet: !!values.sgwPassword,
              loginEnabled: values.loginEnabled,
              mfaEnabled: false,
              passwordHintSet: !!values.password,
            },
            ...state!.teammates,
          ],
        },
        { action: "Created self account profile", resource: values.handle }
      );
    }

    updateSession({
      name: values.name,
      email: values.email,
      handle: values.handle,
      role: values.role,
    });

    const demo = loadDemoSettings();
    saveDemoSettings({
      ...demo,
      name: values.name,
      email: values.email,
      handle: values.handle,
    });
  }

  return (
    <div className="space-y-5">
      <AdminPageIntro
        title="Account"
        description="Edit your login profile, role preferences, and optional ShopGoodwill credentials."
        howTo={[
          "Update name, username, email/password, and MFA reset as needed.",
          "Set role only if you are Admin / Ops (others are read-only).",
          "Optional: store ShopGoodwill credentials used for channel tools.",
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/settings">
              <Button type="button" variant="outline" size="sm">
                Workspace settings
              </Button>
            </Link>
            {isOps || session.role === "Admin" || session.role === "Ops Lead" ? (
              <Link href="/admin/teammates">
                <Button type="button" variant="outline" size="sm">
                  Admin teammates
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />
      <AccountEditForm
        key={bootKey}
        title="Edit Account"
        initial={initial}
        suppliers={state.suppliers}
        allowRoleEdit={isOps || session.role === "Admin"}
        onSave={save}
        onResetMfa={() => {
          if (!self) return;
          persist(
            {
              ...state,
              teammates: state.teammates.map((t) =>
                t.id === self.id ? { ...t, mfaEnabled: false } : t
              ),
            },
            { action: "Reset own MFA", resource: self.handle }
          );
          logEvent({
            section: "admin",
            action: "Reset MFA (self)",
            resource: self.handle,
            resourceHref: "/settings/account",
            orgId,
          });
        }}
      />
      <SectionEventLog section="admin" title="Event log" />
    </div>
  );
}
