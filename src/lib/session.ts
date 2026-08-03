/**
 * Org-aware demo session shape.
 * Password gate remains; this tracks who is signed in + which org is active.
 * Persisted in localStorage (client). Cookie still gates HTTP access.
 */

import { DEFAULT_ORG_ID, getOrgById, type Org } from "./orgs";

export const SESSION_STORAGE_KEY = "stl-demo-session";
export const ACTIVE_ORG_STORAGE_KEY = "stl-active-org-id";
export const OPS_UNLOCK_STORAGE_KEY = "stl-ops-unlocked";

export type DemoSession = {
  email: string;
  name: string;
  handle: string;
  role: string;
  /** Active customer org for floor / admin UX */
  activeOrgId: string;
  /** Explicit Ops unlock via demo password on /ops */
  opsUnlocked: boolean;
  updatedAt: string;
};

export const DEFAULT_SESSION: DemoSession = {
  email: "john.doe@testgoodwill.example",
  name: "John Doe",
  handle: "jdoe",
  role: "Ops Lead",
  activeOrgId: DEFAULT_ORG_ID,
  opsUnlocked: false,
  updatedAt: new Date(0).toISOString(),
};

/** Hammoq staff if email contains "hammoq" (case-insensitive). */
export function isHammoqStaffEmail(email: string): boolean {
  return email.toLowerCase().includes("hammoq");
}

export function canAccessOps(session: DemoSession): boolean {
  return isHammoqStaffEmail(session.email) || session.opsUnlocked;
}

export function loadSession(): DemoSession {
  if (typeof window === "undefined") return { ...DEFAULT_SESSION };
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    const orgRaw = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
    const opsRaw = localStorage.getItem(OPS_UNLOCK_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DemoSession>) : {};
    const activeOrgId =
      orgRaw?.trim() ||
      parsed.activeOrgId ||
      DEFAULT_ORG_ID;
    const org = getOrgById(activeOrgId);
    return {
      ...DEFAULT_SESSION,
      ...parsed,
      activeOrgId: org ? org.id : DEFAULT_ORG_ID,
      opsUnlocked: opsRaw === "1" || parsed.opsUnlocked === true,
    };
  } catch {
    return { ...DEFAULT_SESSION };
  }
}

export function saveSession(session: DemoSession): DemoSession {
  const next = { ...session, updatedAt: new Date().toISOString() };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, next.activeOrgId);
  localStorage.setItem(OPS_UNLOCK_STORAGE_KEY, next.opsUnlocked ? "1" : "0");
  // Mirror cookie for SSR-friendly reads (non-httpOnly)
  document.cookie = `stl_active_org=${encodeURIComponent(next.activeOrgId)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  return next;
}

export function setActiveOrgId(orgId: string): DemoSession {
  const session = loadSession();
  const org = getOrgById(orgId);
  return saveSession({
    ...session,
    activeOrgId: org ? org.id : DEFAULT_ORG_ID,
  });
}

export function unlockOps(): DemoSession {
  const session = loadSession();
  return saveSession({ ...session, opsUnlocked: true });
}

export function activeOrgFromSession(session: DemoSession): Org {
  return getOrgById(session.activeOrgId) ?? getOrgById(DEFAULT_ORG_ID)!;
}
