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
import { useSession } from "next-auth/react";
import { DEFAULT_ORG_ID, PILOT_ORGS, getOrgById, type Org } from "@/lib/orgs";
import {
  canAccessOps,
  DEFAULT_SESSION,
  saveSession,
  type DemoSession,
} from "@/lib/session";
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

function toDemoSession(
  auth: {
    id: string;
    email: string;
    name: string;
    handle: string;
    orgId: string;
    role: string;
    isOps: boolean;
    membershipOrgIds: string[];
  } | null | undefined
): DemoSession {
  if (!auth) return { ...DEFAULT_SESSION };
  return {
    userId: auth.id,
    email: auth.email,
    name: auth.name,
    handle: auth.handle || auth.email.split("@")[0] || "user",
    role: auth.role,
    activeOrgId: auth.orgId || DEFAULT_ORG_ID,
    isOps: auth.isOps,
    membershipOrgIds: auth.membershipOrgIds?.length
      ? auth.membershipOrgIds
      : auth.isOps
        ? PILOT_ORGS.map((o) => o.id)
        : [auth.orgId || DEFAULT_ORG_ID],
    opsUnlocked: auth.isOps,
    updatedAt: new Date().toISOString(),
  };
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { data: authSession, status, update } = useSession();
  const [session, setSession] = useState<DemoSession>(DEFAULT_SESSION);
  const hydrated = status !== "loading";

  useEffect(() => {
    if (status !== "authenticated" || !authSession?.user) return;
    const next = toDemoSession(authSession.user);
    setSession(next);
    if (typeof window !== "undefined") {
      saveSession(next);
    }
  }, [authSession, status]);

  const setActiveOrgId = useCallback(
    (orgId: string) => {
      const org = getOrgById(orgId);
      if (!org) return;
      setSession((prev) => {
        const allowed =
          prev.isOps ||
          prev.membershipOrgIds.includes(orgId) ||
          prev.membershipOrgIds.length === 0;
        if (!allowed) return prev;
        const next = saveSession({
          ...prev,
          activeOrgId: org.id,
          role: prev.isOps ? prev.role : prev.role,
        });
        void update({ orgId: org.id });
        void fetch("/api/org/switch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orgId: org.id }),
        });
        return next;
      });
    },
    [update]
  );

  const updateSession = useCallback((patch: Partial<DemoSession>) => {
    setSession((prev) => {
      const next = saveSession({ ...prev, ...patch });
      return next;
    });
  }, []);

  const unlockOps = useCallback(() => {
    setSession((prev) => saveSession({ ...prev, opsUnlocked: true }));
  }, []);

  const org = useMemo(
    () => getOrgById(session.activeOrgId) ?? getOrgById(DEFAULT_ORG_ID)!,
    [session.activeOrgId]
  );

  const orgs = useMemo(() => {
    if (session.isOps) return PILOT_ORGS;
    const ids = new Set(session.membershipOrgIds);
    const filtered = PILOT_ORGS.filter((o) => ids.has(o.id));
    return filtered.length > 0 ? filtered : PILOT_ORGS.filter((o) => o.id === DEFAULT_ORG_ID);
  }, [session.isOps, session.membershipOrgIds]);

  const value = useMemo<OrgContextValue>(
    () => ({
      hydrated,
      session,
      org,
      orgs,
      isOps: canAccessOps(session),
      setActiveOrgId,
      updateSession,
      unlockOps,
      api: getApiClient(),
    }),
    [hydrated, session, org, orgs, setActiveOrgId, updateSession, unlockOps]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
