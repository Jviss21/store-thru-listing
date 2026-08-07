"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND } from "@/lib/mock-data";
import { Button, Input } from "@/components/ui";
import { OPS_EMAIL, PILOT_PASSWORD, SEED_USERS, findSeedUserByEmail } from "@/lib/db/seed-data";
import { logEvent } from "@/lib/event-log";
import { DEFAULT_ORG_ID } from "@/lib/orgs";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const wantsOps = searchParams.get("ops") === "1";
  const [email, setEmail] = useState(
    wantsOps ? OPS_EMAIL : "john.doe@testgoodwill.example"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const examples = useMemo(
    () =>
      SEED_USERS.filter((u) => !u.isOps)
        .slice(0, 3)
        .map((u) => u.email),
    []
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const seed = findSeedUserByEmail(trimmedEmail);
    const orgId = seed?.primaryOrgId || DEFAULT_ORG_ID;
    const handle = seed?.handle || trimmedEmail.split("@")[0] || "unknown";
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        logEvent({
          section: "auth",
          action: "Login failed",
          resource: trimmedEmail || "unknown",
          resourceHref: "/login",
          entityId: seed?.id,
          detail: "Incorrect email or password",
          user: handle,
          userName: seed?.name,
          orgId,
        });
        setError("Incorrect email or password. Use a pilot account and the shared password.");
        setLoading(false);
        return;
      }
      logEvent({
        section: "auth",
        action: "Login succeeded",
        resource: trimmedEmail || "unknown",
        resourceHref: "/",
        entityId: seed?.id,
        detail: wantsOps ? "Ops sign-in" : "Credentials sign-in",
        user: handle,
        userName: seed?.name,
        orgId,
      });
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      logEvent({
        section: "auth",
        action: "Login failed",
        resource: trimmedEmail || "unknown",
        resourceHref: "/login",
        detail: "Unexpected error during sign-in",
        user: handle,
        orgId,
      });
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,180,41,0.16),transparent),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(232,122,26,0.1),transparent),linear-gradient(180deg,#f5f7fb_0%,#eef2f8_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-ink/10 bg-white/90 p-8 shadow-float backdrop-blur">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hammoq-logo.png"
            alt=""
            width={48}
            height={48}
            className="mx-auto h-12 w-12 rounded-full object-cover"
          />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink">
            Store thru Listing
          </h1>
          <p className="mt-1 text-sm text-muted">
            10-org pilot · Powered by {BRAND.product}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@testgoodwill.example"
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 space-y-2 rounded-xl border border-ink/10 bg-mist/50 px-3 py-3 text-xs text-muted">
          <p>
            Shared pilot password:{" "}
            <span className="font-mono font-semibold text-ink">{PILOT_PASSWORD}</span>
            {wantsOps ? (
              <>
                {" "}
                · Ops: <span className="font-mono text-ink">{OPS_EMAIL}</span>
              </>
            ) : null}
          </p>
          <p>
            Examples: {examples.join(", ")}
            {wantsOps ? "" : ` · Ops: ${OPS_EMAIL}`}
          </p>
          <p className="text-[11px] leading-relaxed">
            Role demos (Test Goodwill): john.doe@… Lister · morgan.hale@… Admin ·
            jane.smith@… Lister · bob.wilson@… Photographer · chris.taylor@… Viewer
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
