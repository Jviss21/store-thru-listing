"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { InfinityBadge } from "@/components/Brand";
import { BRAND } from "@/lib/mock-data";
import {
  DEFAULT_SETTINGS,
  loadDemoSettings,
  saveDemoSettings,
  type DemoSettings,
} from "@/lib/demo-settings";
import { useOrg } from "@/components/OrgProvider";
import { SectionEventLog } from "@/components/SectionEventLog";
import { logEvent } from "@/lib/event-log";
import { isHammoqStaffEmail } from "@/lib/session";

export default function SettingsPage() {
  const { org, updateSession, isOps } = useOrg();
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
      org: settings.org.trim() || org.name,
    };
    saveDemoSettings(next);
    setSettings(next);
    updateSession({
      name: next.name,
      email: next.email,
      handle: next.handle,
    });
    logEvent({
      section: "admin",
      action: "Updated workspace settings",
      resource: "Settings",
      resourceHref: "/settings",
      orgId: org.id,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description={`Workspace preferences for ${org.name}.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/settings/account"
              className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
            >
              Edit Account →
            </Link>
            <Link
              href="/settings/connections"
              className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
            >
              Marketplace connections →
            </Link>
            <Link
              href="/workflow"
              className="text-sm font-semibold text-muted underline-offset-2 hover:underline"
            >
              Item pipeline →
            </Link>
          </div>
        }
      />

      <Card className="max-w-xl space-y-3 border-accent/30 bg-accent/10 p-5">
        <p className="font-display text-lg font-bold text-ink">Edit Account</p>
        <p className="text-sm text-muted">
          Full name, username, email/password, role, supplier, ShopGoodwill login, and MFA reset.
        </p>
        <Link href="/settings/account">
          <Button type="button" variant="accent">
            Open account settings
          </Button>
        </Link>
      </Card>

      <Card className="max-w-xl space-y-3 p-5">
        <p className="font-display text-lg font-bold text-ink">Item pipeline</p>
        <p className="text-sm text-muted">
          Walk one SKU top-to-bottom: intake → donor → putaway → photos/Auto-List → QA → strategy →
          channels → pick/pack → ship → sold.
        </p>
        <Link href="/workflow">
          <Button type="button" variant="outline">
            Open Item pipeline
          </Button>
        </Link>
      </Card>

      <Card className="max-w-xl space-y-4 p-5">
        <p className="text-sm font-semibold text-ink">Quick profile (legacy)</p>
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
          <p className="mt-1 text-xs text-muted">
            Emails containing <span className="font-mono">hammoq</span> unlock the Hammoq Ops
            nav link.
            {isHammoqStaffEmail(settings.email) || isOps ? " Ops access active." : ""}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Organization label</label>
          <Input
            className="mt-1"
            value={settings.org}
            onChange={(e) => update("org", e.target.value)}
            disabled={!hydrated}
          />
          <p className="mt-1 text-xs text-muted">
            Active org (switcher): {org.name}. Use the sidebar org switcher or{" "}
            <Link href="/ops" className="font-semibold underline-offset-2 hover:underline">
              Hammoq Ops
            </Link>{" "}
            to change tenants.
          </p>
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
          Toggle which automation features run for this workspace. Powered quietly by{" "}
          {BRAND.product}. Preferences persist in localStorage for this browser. Auto-List only —
          no Auto-Draft.
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
              logEvent({
                section: "admin",
                action: next.autoList ? "Enabled Auto-List" : "Disabled Auto-List",
                resource: "Settings",
                resourceHref: "/settings",
                orgId: org.id,
              });
            }}
          />
        </label>
      </Card>

      <SectionEventLog section="admin" title="Settings activity" />
    </div>
  );
}
