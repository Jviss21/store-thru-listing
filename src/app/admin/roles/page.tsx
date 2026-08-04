"use client";

import { Copy, Eye, Settings2 } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminRolesPage() {
  const { state, persist, ready, saved } = useAdminIms();
  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const defaults = state.roles.filter((r) => r.kind === "default");
  const customs = state.roles.filter((r) => r.kind === "custom");

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Roles"]} />
      <AdminPageIntro
        title="Roles"
        description="Default roles map to floor auth (Admin, Ops Lead, Lister, Photographer, Viewer). Custom roles are demo cards for pilot IA."
        actions={
          <Button
            type="button"
            onClick={() =>
              persist(
                {
                  ...state,
                  roles: [
                    ...state.roles,
                    {
                      id: `role-custom-${Date.now()}`,
                      name: "New custom role",
                      description: "Describe permissions for this role",
                      teammateCount: 0,
                      kind: "custom",
                      mapsTo: "Viewer",
                    },
                  ],
                },
                { action: "Added custom role", resource: "Roles" }
              )
            }
          >
            Add custom role
          </Button>
        }
      />
      {saved ? <p className="text-sm text-mustard">Saved.</p> : null}

      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-ink">Default Roles</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {defaults.map((r) => (
            <SectionCard key={r.id} className="relative p-4">
              <div className="absolute right-3 top-3 flex gap-1 text-muted">
                <Copy className="h-4 w-4" />
                <Eye className="h-4 w-4" />
              </div>
              <p className="pr-12 font-display text-base font-bold text-ink">{r.name}</p>
              <p className="mt-1 text-sm text-muted">{r.description}</p>
              <p className="mt-3 text-xs text-muted">{r.teammateCount} teammates</p>
              {r.mapsTo ? (
                <Badge className="mt-2" tone="yellow">
                  Auth: {r.mapsTo}
                </Badge>
              ) : null}
            </SectionCard>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-display text-lg font-bold text-ink">Custom Roles</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {customs.map((r) => (
            <SectionCard key={r.id} className="relative p-4">
              <div className="absolute right-3 top-3 flex gap-1 text-muted">
                <Copy className="h-4 w-4" />
                <Settings2 className="h-4 w-4" />
              </div>
              <p className="pr-12 font-display text-base font-bold text-ink">{r.name}</p>
              <p className="mt-1 text-sm text-muted">{r.description}</p>
              <p className="mt-3 text-xs text-muted">{r.teammateCount} teammates</p>
              {r.mapsTo ? (
                <Badge className="mt-2" tone="neutral">
                  Maps to {r.mapsTo}
                </Badge>
              ) : null}
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
