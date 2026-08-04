"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
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
import type { ListingTemplate } from "@/lib/admin-ims";

export default function AdminTemplateEditorPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { state, persist, saved, ready } = useAdminIms();
  const [draft, setDraft] = useState<ListingTemplate | null>(null);
  const [inputDraft, setInputDraft] = useState("");

  useEffect(() => {
    if (!state) return;
    const t = state.templates.find((x) => x.id === id);
    setDraft(t ? { ...t, inputs: [...t.inputs] } : null);
  }, [state, id]);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;
  if (!draft) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Template not found.</p>
        <Link href="/admin/templates" className="text-sm font-semibold underline">
          Back to templates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Templates", draft.title]} />
      <AdminPageIntro
        title="Template editor"
        description="Define inputs, then compose title and body with {{variable}} placeholders."
        actions={
          <Link href="/admin/templates">
            <Button type="button" variant="outline">
              Back
            </Button>
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Inputs">
          <div className="mb-3 flex gap-2">
            <Input
              placeholder="variable_name"
              value={inputDraft}
              onChange={(e) => setInputDraft(e.target.value)}
            />
            <Button
              type="button"
              onClick={() => {
                const v = inputDraft.trim().replace(/\s+/g, "_");
                if (!v || draft.inputs.includes(v)) return;
                setDraft({ ...draft, inputs: [...draft.inputs, v] });
                setInputDraft("");
              }}
            >
              Add
            </Button>
          </div>
          <ul className="space-y-2">
            {draft.inputs.map((inp) => (
              <li
                key={inp}
                className="flex items-center justify-between rounded-lg border border-ink/8 px-3 py-2 text-sm"
              >
                <code className="text-ink">{`{{${inp}}}`}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    setDraft({ ...draft, inputs: draft.inputs.filter((x) => x !== inp) })
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          <FieldHelp>Click a token in the list when editing body to copy the placeholder.</FieldHelp>
        </SectionCard>

        <SectionCard title="Output">
          <div className="space-y-3">
            <div>
              <FieldLabel>Template title</FieldLabel>
              <Input
                className="mt-1"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Status</FieldLabel>
              <SelectField
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as ListingTemplate["status"],
                  })
                }
              >
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
              </SelectField>
            </div>
            <div>
              <FieldLabel>Output title</FieldLabel>
              <Input
                className="mt-1"
                value={draft.outputTitle}
                onChange={(e) => setDraft({ ...draft, outputTitle: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Output body</FieldLabel>
              <Textarea
                className="mt-1 min-h-[180px] font-mono text-xs"
                value={draft.outputBody}
                onChange={(e) => setDraft({ ...draft, outputBody: e.target.value })}
              />
            </div>
          </div>
        </SectionCard>
      </div>
      <SaveBar
        saved={saved}
        onSave={() =>
          persist(
            {
              ...state,
              templates: state.templates.map((t) =>
                t.id === draft.id
                  ? { ...draft, updatedAt: new Date().toISOString().slice(0, 10) }
                  : t
              ),
            },
            { action: "Saved template", resource: draft.title }
          )
        }
      />
    </div>
  );
}
