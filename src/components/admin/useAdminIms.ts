"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/components/OrgProvider";
import {
  loadAdminIms,
  saveAdminIms,
  type AdminImsState,
} from "@/lib/admin-ims";
import { logEvent } from "@/lib/event-log";

/**
 * Admin IMS state: hydrate from Postgres OrgSettings when available,
 * else localStorage. New saves write localStorage always and Postgres when possible.
 */
export function useAdminIms() {
  const { org, hydrated: orgHydrated } = useOrg();
  const [state, setState] = useState<AdminImsState | null>(null);
  const [saved, setSaved] = useState(false);
  const [dbSource, setDbSource] = useState<"prisma" | "local" | "empty">("local");

  useEffect(() => {
    if (!orgHydrated) return;
    let cancelled = false;
    const local = loadAdminIms(org.id);
    setState(local);

    (async () => {
      try {
        const res = await fetch(`/api/org/settings?orgId=${encodeURIComponent(org.id)}`);
        const json = (await res.json()) as {
          ok?: boolean;
          source?: string;
          data?: Partial<AdminImsState> | null;
        };
        if (cancelled || !json.ok) return;
        if (json.data && typeof json.data === "object") {
          // Persist DB blob then re-load through deepMerge defaults
          saveAdminIms(org.id, json.data as AdminImsState);
          setState(loadAdminIms(org.id));
          setDbSource(json.source === "prisma" ? "prisma" : "empty");
        } else {
          setDbSource(json.source === "empty" ? "empty" : "local");
        }
      } catch {
        if (!cancelled) setDbSource("local");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [org.id, orgHydrated]);

  const persistToDb = useCallback(
    (next: AdminImsState) => {
      void fetch("/api/org/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id, adminIms: next }),
      })
        .then(async (res) => {
          if (res.ok) setDbSource("prisma");
        })
        .catch(() => {
          /* localStorage already saved */
        });
    },
    [org.id]
  );

  const persist = useCallback(
    (next: AdminImsState, event?: { action: string; resource: string }) => {
      saveAdminIms(org.id, next);
      persistToDb(next);
      setState(next);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
      if (event) {
        logEvent({
          section: "admin",
          action: event.action,
          resource: event.resource,
          resourceHref: typeof window !== "undefined" ? window.location.pathname : "/admin",
          orgId: org.id,
        });
      }
    },
    [org.id, persistToDb]
  );

  const update = useCallback(
    (recipe: (prev: AdminImsState) => AdminImsState, event?: { action: string; resource: string }) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = recipe(prev);
        saveAdminIms(org.id, next);
        persistToDb(next);
        if (event) {
          logEvent({
            section: "admin",
            action: event.action,
            resource: event.resource,
            resourceHref: typeof window !== "undefined" ? window.location.pathname : "/admin",
            orgId: org.id,
          });
        }
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2200);
        return next;
      });
    },
    [org.id, persistToDb]
  );

  return {
    state,
    setState,
    persist,
    update,
    saved,
    orgId: org.id,
    ready: !!state,
    dbSource,
  };
}
