import { describe, expect, it } from "vitest";
import {
  hashInviteToken,
  newInviteToken,
  tokenLogSuffix,
  tokensEqual,
} from "@/lib/invite-token";

describe("invite-token", () => {
  it("hashes consistently and never equals raw", () => {
    const raw = newInviteToken();
    expect(raw.length).toBeGreaterThanOrEqual(32);
    const h1 = hashInviteToken(raw);
    const h2 = hashInviteToken(raw);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(raw);
    expect(tokensEqual(h1, h2)).toBe(true);
    expect(tokensEqual(h1, hashInviteToken("other"))).toBe(false);
  });

  it("log suffix hides most of the token", () => {
    const s = tokenLogSuffix("abcdefghijklmnopqrstuvwxyz");
    expect(s.startsWith("…")).toBe(true);
    expect(s.length).toBeLessThan(12);
  });
});
