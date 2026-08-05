"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BRAND } from "@/lib/mock-data";
import { Button, Input } from "@/components/ui";

type InviteMeta = {
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
};

function AcceptInviteInner() {
  const params = useParams();
  const token = String(params.token ?? "");
  const router = useRouter();
  const [meta, setMeta] = useState<InviteMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        const json = (await res.json()) as {
          ok: boolean;
          error?: string;
          data?: InviteMeta;
        };
        if (cancelled) return;
        if (!json.ok || !json.data) {
          setLoadError(json.error || "Invite not found");
          return;
        }
        setMeta(json.data);
        const hint = json.data.email.split("@")[0] ?? "";
        setName(hint.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
      } catch {
        if (!cancelled) setLoadError("Could not load invite");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { email: string } };
      if (!json.ok) {
        setError(json.error || "Could not accept invite");
        setLoading(false);
        return;
      }
      setDone(true);
      const email = json.data?.email || meta?.email;
      if (email) {
        const sign = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (!sign?.error) {
          router.replace("/");
          router.refresh();
          return;
        }
      }
      setLoading(false);
    } catch {
      setError("Something went wrong");
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
            Accept invite
          </h1>
          <p className="mt-1 text-sm text-muted">
            Join your org on {BRAND.product} Store thru Listing
          </p>
        </div>

        {loadError ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-700">{loadError}</p>
            <Link href="/login" className="text-sm font-semibold text-primary underline">
              Go to login
            </Link>
          </div>
        ) : !meta ? (
          <p className="text-sm text-muted">Loading invite…</p>
        ) : meta.status !== "pending" ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-ink">
              {meta.status === "accepted"
                ? "This invite was already accepted."
                : "This invite has expired. Ask an admin to send a new one."}
            </p>
            <Link href="/login" className="text-sm font-semibold text-primary underline">
              Go to login
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink">Account ready. Sign in to continue.</p>
            <Link href="/login">
              <Button type="button">Sign in</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-lg border border-ink/10 bg-mist/40 px-3 py-2 text-sm">
              <p>
                <span className="text-muted">Org</span>{" "}
                <span className="font-semibold text-ink">{meta.orgName}</span>
              </p>
              <p className="mt-1">
                <span className="text-muted">Email</span>{" "}
                <span className="font-mono text-ink">{meta.email}</span>
              </p>
              <p className="mt-1">
                <span className="text-muted">Role</span>{" "}
                <span className="font-semibold text-ink">{meta.role}</span>
              </p>
            </div>
            <div>
              <label htmlFor="name" className="text-sm font-medium text-ink">
                Display name
              </label>
              <Input
                id="name"
                className="mt-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Choose a password
              </label>
              <Input
                id="password"
                type="password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="text-sm font-medium text-ink">
                Confirm password
              </label>
              <Input
                id="confirm"
                type="password"
                className="mt-1"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
              />
            </div>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Accept & join"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">Loading…</div>}>
      <AcceptInviteInner />
    </Suspense>
  );
}
