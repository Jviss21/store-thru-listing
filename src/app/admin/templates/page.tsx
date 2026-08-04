"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Button, Badge, Input } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  SectionCard,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";

export default function AdminTemplatesPage() {
  const { state, persist, ready } = useAdminIms();
  const [tab, setTab] = useState<"builder" | "static">("builder");
  const [qId, setQId] = useState("");
  const [qTitle, setQTitle] = useState("");

  const rows = useMemo(() => {
    if (!state) return [];
    return state.templates
      .filter((t) => t.kind === tab)
      .filter((t) => !qId || t.id.includes(qId))
      .filter((t) => !qTitle || t.title.toLowerCase().includes(qTitle.toLowerCase()));
  }, [state, tab, qId, qTitle]);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const builderCount = state.templates.filter((t) => t.kind === "builder").length;
  const staticCount = state.templates.filter((t) => t.kind === "static").length;

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Templates"]} />
      <AdminPageIntro
        title="Templates"
        description="Builder templates map inputs to title/body with {{variables}}. Static templates are fixed text blocks."
        actions={
          <Button
            type="button"
            onClick={() => {
              const id = `tpl-${Date.now()}`;
              persist(
                {
                  ...state,
                  templates: [
                    {
                      id,
                      title: "Untitled template",
                      kind: tab,
                      status: "Draft",
                      updatedAt: new Date().toISOString().slice(0, 10),
                      inputs: ["brand", "title"],
                      outputTitle: "{{brand}} {{title}}",
                      outputBody: "{{title}} by {{brand}}.",
                    },
                    ...state.templates,
                  ],
                },
                { action: "Created template", resource: id }
              );
            }}
          >
            Create New Template
          </Button>
        }
      />
      <SectionCard>
        <div className="mb-4 flex gap-4 border-b border-ink/10">
          {(
            [
              ["builder", `Builder (${builderCount})`],
              ["static", `Static (${staticCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 px-1 pb-2 text-sm font-semibold ${
                tab === key
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-semibold">Template ID</th>
              <th className="pb-2 font-semibold">Title</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Updated</th>
              <th className="pb-2 font-semibold">Actions</th>
            </tr>
            <tr>
              <th className="pb-3 pr-2">
                <Input value={qId} onChange={(e) => setQId(e.target.value)} placeholder="Filter" />
              </th>
              <th className="pb-3 pr-2">
                <Input
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                  placeholder="Filter"
                />
              </th>
              <th />
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-t border-ink/5">
                <td className="py-2.5 font-mono text-xs">{t.id}</td>
                <td className="py-2.5 font-medium text-ink">{t.title}</td>
                <td className="py-2.5">
                  <Badge tone={t.status === "Published" ? "green" : "neutral"}>{t.status}</Badge>
                </td>
                <td className="py-2.5 text-muted">{t.updatedAt}</td>
                <td className="py-2.5">
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/templates/${t.id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-mist"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-mist"
                      aria-label="Duplicate"
                      onClick={() =>
                        persist(
                          {
                            ...state,
                            templates: [
                              {
                                ...t,
                                id: `tpl-${Date.now()}`,
                                title: `${t.title} (copy)`,
                                status: "Draft",
                                updatedAt: new Date().toISOString().slice(0, 10),
                              },
                              ...state.templates,
                            ],
                          },
                          { action: "Duplicated template", resource: t.title }
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-mist"
                      aria-label="Delete"
                      onClick={() =>
                        persist(
                          {
                            ...state,
                            templates: state.templates.filter((x) => x.id !== t.id),
                          },
                          { action: "Deleted template", resource: t.title }
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-coral" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
