"use client";

import { useEffect, useState, useCallback } from "react";
import { useOrg } from "@/components/OrgProvider";
import {
  loadAdminIms,
  saveAdminIms,
  type AdminImsState,
} from "@/lib/admin-ims";
import { logEvent } from "@/lib/event-log";

export function useAdminIms() {
  const { org, hydrated: orgHydrated } = useOrg();
  const [state, setState] = useState<AdminImsState | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!orgHydrated) return;
    setState(loadAdminIms(org.id));
  }, [org.id, orgHydrated]);

  const persist = useCallback(
    (next: AdminImsState, event?: { action: string; resource: string }) => {
      saveAdminIms(org.id, next);
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
    [org.id]
  );

  const update = useCallback(
    (recipe: (prev: AdminImsState) => AdminImsState, event?: { action: string; resource: string }) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = recipe(prev);
        saveAdminIms(org.id, next);
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
    [org.id]
  );

  return { state, setState, persist, update, saved, orgId: org.id, ready: !!state };
}
