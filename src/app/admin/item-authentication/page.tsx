"use client";

import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  AdminBreadcrumb,
  AdminPageIntro,
  FieldHelp,
  FieldLabel,
  SaveBar,
  SectionCard,
  ToggleRow,
} from "@/components/admin/AdminForm";
import { useAdminIms } from "@/components/admin/useAdminIms";
import {
  generateItemAuthApiKey,
  maskItemAuthApiKey,
  type ItemAuthApiKeyEnv,
} from "@/lib/admin-ims";
import { relativeTime } from "@/lib/utils";

export default function AdminItemAuthPage() {
  const { state, setState, persist, saved, ready } = useAdminIms();
  const [env, setEnv] = useState<ItemAuthApiKeyEnv>("live");
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!ready || !state) return <p className="text-sm text-muted">Loading…</p>;

  const apiKey = state.itemAuth.apiKey;

  function withApiKey(
    nextKey: typeof apiKey,
    event: { action: string; resource: string }
  ) {
    setRevealed(nextKey !== null);
    persist(
      {
        ...state!,
        itemAuth: { ...state!.itemAuth, apiKey: nextKey },
      },
      event
    );
  }

  async function copyKey(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable in insecure contexts */
    }
  }

  return (
    <div className="space-y-5">
      <AdminBreadcrumb trail={["Admin", "Item Authentication"]} />
      <AdminPageIntro
        title="Item Authentication"
        description="Hold rules for luxury and authenticated inventory before Auto-List publish."
      />
      <SectionCard>
        <div className="max-w-xl space-y-4">
          <ToggleRow
            label="Require authentication for luxury brands"
            help="Routes matching categories into Additional QA Required."
            checked={state.itemAuth.requireAuthForLuxury}
            onChange={(v) =>
              setState({ ...state, itemAuth: { ...state.itemAuth, requireAuthForLuxury: v } })
            }
          />
          <div>
            <FieldLabel>Auth confidence hold threshold (%)</FieldLabel>
            <Input
              className="mt-1"
              type="number"
              min={0}
              max={100}
              value={state.itemAuth.authHoldThreshold}
              onChange={(e) =>
                setState({
                  ...state,
                  itemAuth: {
                    ...state.itemAuth,
                    authHoldThreshold: Number(e.target.value) || 0,
                  },
                })
              }
            />
            <FieldHelp>Items below this confidence stay held for human review.</FieldHelp>
          </div>
          <div>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              className="mt-1 min-h-[100px]"
              value={state.itemAuth.notes}
              onChange={(e) =>
                setState({ ...state, itemAuth: { ...state.itemAuth, notes: e.target.value } })
              }
            />
          </div>
          <SaveBar
            saved={saved}
            onSave={() =>
              persist(state, { action: "Updated item authentication", resource: "Item Authentication" })
            }
          />
        </div>
      </SectionCard>

      <SectionCard title="API key">
        <div className="max-w-xl space-y-4">
          <FieldHelp>
            Use this key to authenticate item and donation intake requests, or to connect external
            authentication integrations that submit items for luxury/hold review. This is not a
            sign-in credential — it authorizes programmatic access to item authentication only.
          </FieldHelp>

          {!apiKey ? (
            <div className="space-y-3">
              <div>
                <FieldLabel>Environment</FieldLabel>
                <div className="mt-1 flex gap-2">
                  {(["live", "test"] as const).map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={env === option ? "primary" : "outline"}
                      onClick={() => setEnv(option)}
                    >
                      {option === "live" ? "Live" : "Test"}
                    </Button>
                  ))}
                </div>
                <FieldHelp>
                  Live keys use the <code className="font-mono text-[11px]">ham_live_</code> prefix;
                  test keys use <code className="font-mono text-[11px]">ham_test_</code>.
                </FieldHelp>
              </div>
              <Button
                type="button"
                onClick={() =>
                  withApiKey(generateItemAuthApiKey(env), {
                    action: "Generated item auth API key",
                    resource: "Item Authentication",
                  })
                }
              >
                Generate API key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <FieldLabel>Current key</FieldLabel>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <code className="block min-w-0 flex-1 truncate rounded-xl border border-ink/10 bg-white/80 px-3 py-2 font-mono text-xs text-ink">
                    {revealed ? apiKey.secret : maskItemAuthApiKey(apiKey.secret)}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRevealed((v) => !v)}
                  >
                    {revealed ? "Hide" : "Reveal"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyKey(apiKey.secret)}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <FieldHelp>
                  {apiKey.environment === "live" ? "Live" : "Test"} · Created{" "}
                  {relativeTime(apiKey.createdAt)}
                  {apiKey.lastUsedAt ? ` · Last used ${relativeTime(apiKey.lastUsedAt)}` : ""}
                </FieldHelp>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    withApiKey(generateItemAuthApiKey(apiKey.environment), {
                      action: "Rotated item auth API key",
                      resource: "Item Authentication",
                    })
                  }
                >
                  Rotate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setEnv(apiKey.environment);
                    withApiKey(null, {
                      action: "Revoked item auth API key",
                      resource: "Item Authentication",
                    });
                  }}
                >
                  Revoke
                </Button>
              </div>
              <FieldHelp>
                Rotating replaces the key immediately — update any intake or external auth
                integrations that still use the old value. Revoke removes the key until you generate
                a new one.
              </FieldHelp>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
