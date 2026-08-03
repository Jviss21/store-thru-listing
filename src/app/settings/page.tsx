"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { BRAND, ORG_NAME } from "@/lib/mock-data";
import {
  DEFAULT_SETTINGS,
  loadDemoSettings,
  saveDemoSettings,
  type DemoSettings,
} from "@/lib/demo-settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<DemoSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadDemoSettings());
    setHydrated(true);
  }, []);

  function update<K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function persist() {
    const next = {
      ...settings,
      org: settings.org.trim() || ORG_NAME,
    };
    saveDemoSettings(next);
    setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description={`Account and ${BRAND.ai} preferences for ${ORG_NAME}.`}
      />
      <Card className="max-w-xl space-y-4 p-5">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input
            className="mt-1"
            value={settings.name}
            onChange={(e) => update("name", e.target.value)}
            disabled={!hydrated}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            className="mt-1"
            value={settings.email}
            onChange={(e) => update("email", e.target.value)}
            disabled={!hydrated}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Organization</label>
          <Input
            className="mt-1"
            value={settings.org}
            onChange={(e) => update("org", e.target.value)}
            disabled={!hydrated}
          />
          <p className="mt-1 text-xs text-muted">Default customer org: {ORG_NAME}</p>
        </div>
        <div>
          <label className="text-sm font-medium">Handle</label>
          <Input
            className="mt-1"
            value={settings.handle}
            onChange={(e) => update("handle", e.target.value)}
            disabled={!hydrated}
          />
        </div>
        <Button type="button" onClick={persist} disabled={!hydrated}>
          Save changes
        </Button>
        {saved && (
          <p className="text-sm text-mustard">Saved on this device for the demo session.</p>
        )}
      </Card>

      <Card className="max-w-xl space-y-4 p-5">
        <div className="flex items-center gap-2">
          <InfinityBadge />
          <h2 className="font-display text-lg font-bold text-ink">{BRAND.ai}</h2>
        </div>
        <p className="text-sm text-muted">
          Toggle which automation features run for this workspace. Powered quietly by {BRAND.product}.
          Preferences persist in localStorage for this browser.
        </p>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-semibold text-ink">{BRAND.autoList}</span>
            <span className="mt-0.5 block text-muted">Push ready products to marketplaces</span>
          </span>
          <input
            type="checkbox"
            checked={settings.autoList}
            disabled={!hydrated}
            onChange={(e) => {
              const next = { ...settings, autoList: e.target.checked };
              setSettings(next);
              saveDemoSettings(next);
            }}
          />
        </label>
      </Card>
    </div>
  );
}
