"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui";
import {
  AccountEditForm,
  teammateToForm,
  type AccountFormValues,
} from "@/components/admin/AccountEditForm";
import { AdminBreadcrumb, AdminPageIntro } from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { useOrg } from "@/components/OrgProvider";
import { logEvent } from "@/lib/event-log";

export default function AdminTeammateEditPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { state, persist, ready, orgId } = useAdminIms();
  const { updateSession, session } = useOrg();

  const teammate = useMemo(
    () => state?.teammates.find((t) => t.id === id) ?? null,
    [state, id]
  );

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  if (!teammate) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Teammate not found.</p>
        <Link href="/admin/teammates" className="text-sm font-semibold underline">
          Back to teammates
        </Link>
      </div>
    );
  }

  function save(values: AccountFormValues) {
    const nextStatus = values.loginEnabled
      ? teammate!.status === "Deactivated"
        ? ("Active" as const)
        : teammate!.status
      : ("Deactivated" as const);

    persist(
      {
        ...state!,
        teammates: state!.teammates.map((t) =>
          t.id === id
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
                status: nextStatus,
              }
            : t
        ),
      },
      { action: "Updated teammate account", resource: values.handle }
    );

    if (session.handle === teammate!.handle || session.email === teammate!.email) {
      updateSession({
        name: values.name,
        email: values.email,
        handle: values.handle,
        role: values.role,
      });
    }
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Teammates", teammate.name]} />
      <AdminPageIntro
        title="Edit teammate"
        description={`Account settings for ${teammate.email}`}
        actions={
          <Link href="/admin/teammates">
            <Button type="button" variant="outline">
              Back
            </Button>
          </Link>
        }
      />
      <AccountEditForm
        key={teammate.id}
        initial={teammateToForm(teammate)}
        suppliers={state.suppliers}
        onSave={save}
        onResetMfa={() => {
          persist(
            {
              ...state,
              teammates: state.teammates.map((t) =>
                t.id === id ? { ...t, mfaEnabled: false } : t
              ),
            },
            { action: "Reset MFA", resource: teammate.handle }
          );
          logEvent({
            section: "admin",
            action: "Reset MFA for teammate",
            resource: teammate.handle,
            resourceHref: `/admin/teammates/${id}`,
            orgId,
          });
        }}
      />
    </div>
  );
}
