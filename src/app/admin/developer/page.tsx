"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import { relativeTime } from "@/lib/utils";

export default function AdminDeveloperPage() {
  const { state, persist, ready, saved } = useAdminIms();
  const [name, setName] = useState("");

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Developer"]} />
      <AdminPageIntro
        title="Developer"
        description="API tokens for org integrations. Tokens are mocked — prefixes only, no secrets stored."
      />
      {saved ? <p className="text-sm text-mustard">Saved.</p> : null}
      <SectionCard>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder="Token name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            type="button"
            onClick={() => {
              if (!name.trim()) return;
              const suffix = Math.random().toString(36).slice(2, 6);
              persist(
                {
                  ...state,
                  developer: {
                    tokens: [
                      {
                        id: `tok-${Date.now()}`,
                        name: name.trim(),
                        prefix: `hmq_live_${suffix}…`,
                        createdAt: new Date().toISOString(),
                        lastUsedAt: null,
                      },
                      ...state.developer.tokens,
                    ],
                  },
                },
                { action: "Created API token", resource: name.trim() }
              );
              setName("");
            }}
          >
            Create token
          </Button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 font-semibold">Prefix</th>
              <th className="pb-2 font-semibold">Created</th>
              <th className="pb-2 font-semibold">Last used</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.developer.tokens.map((t) => (
              <tr key={t.id} className="border-b border-ink/5">
                <td className="py-2.5 font-medium">{t.name}</td>
                <td className="py-2.5 font-mono text-xs">{t.prefix}</td>
                <td className="py-2.5 text-muted">{relativeTime(t.createdAt)}</td>
                <td className="py-2.5 text-muted">
                  {t.lastUsedAt ? relativeTime(t.lastUsedAt) : "—"}
                </td>
                <td className="py-2.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      persist(
                        {
                          ...state,
                          developer: {
                            tokens: state.developer.tokens.filter((x) => x.id !== t.id),
                          },
                        },
                        { action: "Revoked API token", resource: t.name }
                      )
                    }
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
