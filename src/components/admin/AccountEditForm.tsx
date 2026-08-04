"use client";

import { useMemo, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import {
  FieldHelp,
  FieldLabel,
  SelectField,
} from "@/components/admin/AdminForm";
import {
  passwordMeetsAll,
  passwordRequirements,
  type Supplier,
  type TeammateAccount,
} from "@/lib/admin-ims";
import type { AdminRole } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const ROLES: AdminRole[] = ["Admin", "Ops Lead", "Lister", "Photographer", "Viewer"];

export type AccountFormValues = {
  name: string;
  handle: string;
  email: string;
  password: string;
  role: AdminRole;
  supplierId: string | null;
  sgwUsername: string;
  sgwPassword: string;
  loginEnabled: boolean;
};

export function teammateToForm(t: TeammateAccount): AccountFormValues {
  return {
    name: t.name,
    handle: t.handle,
    email: t.email,
    password: "",
    role: t.role,
    supplierId: t.supplierId,
    sgwUsername: t.sgwUsername,
    sgwPassword: "",
    loginEnabled: t.loginEnabled,
  };
}

export function AccountEditForm({
  initial,
  suppliers,
  onSave,
  onResetMfa,
  title = "Edit Account",
  allowRoleEdit = true,
}: {
  initial: AccountFormValues;
  suppliers: Supplier[];
  onSave: (values: AccountFormValues) => void;
  onResetMfa?: () => void;
  title?: string;
  allowRoleEdit?: boolean;
}) {
  const [values, setValues] = useState<AccountFormValues>(initial);
  const [flash, setFlash] = useState<string | null>(null);
  const [mfaFlash, setMfaFlash] = useState<string | null>(null);

  const reqs = useMemo(() => passwordRequirements(values.password), [values.password]);
  const passwordOk = !values.password || passwordMeetsAll(values.password);

  function patch<K extends keyof AccountFormValues>(key: K, value: AccountFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit() {
    if (!passwordOk) {
      setFlash("Password does not meet requirements.");
      setTimeout(() => setFlash(null), 2500);
      return;
    }
    onSave(values);
    setValues((v) => ({ ...v, password: "", sgwPassword: "" }));
    setFlash("Account saved.");
    setTimeout(() => setFlash(null), 2200);
  }

  return (
    <Card className="max-w-xl overflow-hidden">
      <div className="border-b border-ink/8 bg-ink px-5 py-3">
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-5 p-5">
        <div>
          <FieldLabel>Full name</FieldLabel>
          <Input
            className="mt-1"
            value={values.name}
            onChange={(e) => patch("name", e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input
            className="mt-1"
            value={values.handle}
            onChange={(e) => patch("handle", e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input
            className="mt-1"
            type="email"
            value={values.email}
            onChange={(e) => patch("email", e.target.value)}
            autoComplete="email"
          />
          <FieldHelp>Enables login with email and password</FieldHelp>
        </div>
        <div>
          <FieldLabel>Password</FieldLabel>
          <Input
            className="mt-1"
            type="password"
            value={values.password}
            onChange={(e) => patch("password", e.target.value)}
            autoComplete="new-password"
            placeholder="Leave blank to keep current"
          />
          <div className="mt-3 rounded-xl border border-ink/8 bg-mist/40 px-3 py-2.5">
            <p className="text-xs font-semibold text-ink">Passwords must:</p>
            <ul className="mt-2 space-y-1.5">
              {reqs.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-xs">
                  {r.ok ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mustard" />
                  ) : (
                    <X
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        values.password ? "text-coral" : "text-muted"
                      )}
                    />
                  )}
                  <span className={r.ok ? "text-ink" : "text-muted"}>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <FieldLabel>Role</FieldLabel>
          <SelectField
            value={values.role}
            disabled={!allowRoleEdit}
            onChange={(e) => patch("role", e.target.value as AdminRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>
          <FieldHelp>The permissions available for this user if you change your own role.</FieldHelp>
        </div>

        <div>
          <FieldLabel>Supplier (optional)</FieldLabel>
          <SelectField
            value={values.supplierId ?? ""}
            onChange={(e) => patch("supplierId", e.target.value || null)}
          >
            <option value="">(None)</option>
            {suppliers
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.abbreviation})
                </option>
              ))}
          </SelectField>
          <FieldHelp>
            This account that works for a supplier of your organization. They won&apos;t see
            inventory and sales from other suppliers.
          </FieldHelp>
        </div>

        <div className="border-t border-ink/8 pt-4">
          <p className="mb-3 text-sm font-bold text-ink">Shopgoodwill login</p>
          <div className="space-y-4">
            <div>
              <FieldLabel>Shopgoodwill username (optional)</FieldLabel>
              <Input
                className="mt-1"
                value={values.sgwUsername}
                onChange={(e) => patch("sgwUsername", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Shopgoodwill password (optional)</FieldLabel>
              <Input
                className="mt-1"
                type="password"
                value={values.sgwPassword}
                onChange={(e) => patch("sgwPassword", e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-ink/8 pt-4">
          <div>
            <FieldLabel>Login enabled</FieldLabel>
            <SelectField
              value={values.loginEnabled ? "Active" : "Inactive"}
              onChange={(e) => patch("loginEnabled", e.target.value === "Active")}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectField>
            <FieldHelp>Whether or not this user is able to login and access data.</FieldHelp>
          </div>
          <div className="mt-4">
            <FieldLabel>Multi-factor authentication</FieldLabel>
            <div className="mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onResetMfa?.();
                  setMfaFlash("MFA reset queued — user must set up MFA on next login.");
                  setTimeout(() => setMfaFlash(null), 2800);
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                Reset MFA
              </Button>
            </div>
            <FieldHelp>
              Resetting MFA will require the user to setup MFA again on their next login.
            </FieldHelp>
            {mfaFlash ? <p className="mt-2 text-sm text-brand-orange">{mfaFlash}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/8 pt-4">
          <Button type="button" onClick={submit} disabled={!passwordOk && !!values.password}>
            Save
          </Button>
          {flash ? <span className="text-sm font-medium text-mustard">{flash}</span> : null}
        </div>
      </div>
    </Card>
  );
}
