"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ORG_ID, PILOT_ORGS, getOrgById, type Org } from "@/lib/orgs";
import {
  canAccessOps,
  DEFAULT_SESSION,
  loadSession,
  saveSession,
  setActiveOrgId as persistActiveOrgId,
  unlockOps as persistUnlockOps,
  type DemoSession,
} from "@/lib/session";
import { loadDemoSettings } from "@/lib/demo-settings";
import { getApiClient } from "@/lib/api";

type OrgContextValue = {
  hydrated: boolean;
  session: DemoSession;
  org: Org;
  orgs: Org[];
  isOps: boolean;
  setActiveOrgId: (orgId: string) => void;
  updateSession: (patch: Partial<DemoSession>) => void;
  unlockOps: () => void;
  api: ReturnType<typeof getApiClient>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<DemoSession>(DEFAULT_SESSION);

  useEffect(() => {
    const base = loadSession();
    const settings = loadDemoSettings();
    const merged = saveSession({
      ...base,
      name: settings.name || base.name,
      email: settings.email || base.email,
      handle: settings.handle || base.handle,
    });
    setSession(merged);
    setHydrated(true);
  }, []);

  const setActiveOrgId = useCallback((orgId: string) => {
    const next = persistActiveOrgId(orgId);
    setSession(next);
  }, []);

  const updateSession = useCallback((patch: Partial<DemoSession>) => {
    setSession((prev) => {
      const next = saveSession({ ...prev, ...patch });
      return next;
    });
  }, []);

  const unlockOps = useCallback(() => {
    setSession(persistUnlockOps());
  }, []);

  const org = useMemo(
    () => getOrgById(session.activeOrgId) ?? getOrgById(DEFAULT_ORG_ID)!,
    [session.activeOrgId]
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      hydrated,
      session,
      org,
      orgs: PILOT_ORGS,
      isOps: canAccessOps(session),
      setActiveOrgId,
      updateSession,
      unlockOps,
      api: getApiClient(),
    }),
    [hydrated, session, org, setActiveOrgId, updateSession, unlockOps]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
