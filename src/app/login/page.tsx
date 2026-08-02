"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND, ORG_NAME } from "@/lib/mock-data";
import { Button, Input } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password. Ask your Hammoq contact for access.");
        setLoading(false);
        return;
      }
      router.replace(next.startsWith("/") ? next : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(240,180,41,0.18),transparent),linear-gradient(180deg,#f7f5f0_0%,#eef1f6_100%)] px-4">
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
            {ORG_NAME}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Store thru listing · Powered by {BRAND.product}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Demo access password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          {error && (
            <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Checking…" : "Enter demo"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Customer pilot environment. Data is illustrative — not live inventory.
        </p>
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
