import { BRAND, CURRENT_USER, ORG_NAME } from "@/lib/mock-data";

const KEY = "test-goodwill-settings";

export type DemoSettings = {
  name: string;
  email: string;
  org: string;
  handle: string;
  autoDraft: boolean;
  autoList: boolean;
};

export const DEFAULT_SETTINGS: DemoSettings = {
  name: CURRENT_USER.name,
  email: CURRENT_USER.email,
  org: ORG_NAME,
  handle: CURRENT_USER.handle,
  autoDraft: true,
  autoList: true,
};

export function loadDemoSettings(): DemoSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<DemoSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      org: parsed.org?.trim() || ORG_NAME,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveDemoSettings(settings: DemoSettings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
  return settings;
}

export function settingsLabel() {
  return `${BRAND.ai} preferences`;
}
