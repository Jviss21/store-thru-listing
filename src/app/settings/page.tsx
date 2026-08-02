"use client";

import { useState } from "react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { BRAND, CURRENT_USER, ORG_NAME } from "@/lib/mock-data";

export default function SettingsPage() {
  const [name, setName] = useState(CURRENT_USER.name);
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [org, setOrg] = useState(ORG_NAME);
  const [autoDraft, setAutoDraft] = useState(true);
  const [autoList, setAutoList] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description={`Account and ${BRAND.ai} preferences for ${ORG_NAME}.`}
      />
      <Card className="max-w-xl space-y-4 p-5">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Organization</label>
          <Input className="mt-1" value={org} onChange={(e) => setOrg(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Handle</label>
          <Input className="mt-1" defaultValue={CURRENT_USER.handle} />
        </div>
        <Button
          type="button"
          onClick={() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          Save changes
        </Button>
        {saved && <p className="text-sm text-mustard">Saved (demo only — not persisted).</p>}
      </Card>

      <Card className="max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-2">
          <InfinityBadge />
          <h2 className="font-display text-lg font-bold text-ink">{BRAND.ai}</h2>
        </div>
        <p className="text-sm text-muted">
          Toggle which automation features run for this workspace. Powered quietly by {BRAND.product}.
        </p>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold text-ink">{BRAND.autoDraft}</span>
            <span className="mt-0.5 block text-muted">Suggest titles, categories, and prices</span>
          </span>
          <input type="checkbox" checked={autoDraft} onChange={(e) => setAutoDraft(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold text-ink">{BRAND.autoList}</span>
            <span className="mt-0.5 block text-muted">Push ready products to marketplaces</span>
          </span>
          <input type="checkbox" checked={autoList} onChange={(e) => setAutoList(e.target.checked)} />
        </label>
      </Card>
    </div>
  );
}
