import { describe, expect, it } from "vitest";
import {
  passwordMeetsAll,
  passwordRequirements,
  validatePassword,
} from "@/lib/password-policy";

describe("password-policy", () => {
  it("rejects short / weak passwords", () => {
    expect(passwordMeetsAll("short")).toBe(false);
    expect(passwordMeetsAll("nouppercase1!")).toBe(false);
    expect(passwordMeetsAll("NOLOWERCASE1!")).toBe(false);
    expect(passwordMeetsAll("NoNumber!!!!")).toBe(false);
    expect(passwordMeetsAll("NoSpecialChar1")).toBe(false);
  });

  it("accepts policy-compliant password", () => {
    const pw = "GoodPassw0rd!";
    expect(passwordMeetsAll(pw)).toBe(true);
    expect(validatePassword(pw)).toEqual({ ok: true });
    expect(passwordRequirements(pw).every((r) => r.ok)).toBe(true);
  });
});
