/**
 * Shared password policy — used by account edit UI, invite accept, and APIs.
 * Rules: 12+ chars, upper, lower, number, special.
 */

export type PasswordRequirement = {
  id: string;
  label: string;
  ok: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "Be a minimum of 12 characters in length",
      ok: password.length >= 12,
    },
    {
      id: "upper",
      label: "Contain at least 1 uppercase letter",
      ok: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "Contain at least 1 lowercase letter",
      ok: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "Contain at least 1 number",
      ok: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "Contain at least 1 special character",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function passwordMeetsAll(password: string): boolean {
  return passwordRequirements(password).every((r) => r.ok);
}

export function validatePassword(
  password: string
): { ok: true } | { ok: false; error: string } {
  if (!passwordMeetsAll(password)) {
    return {
      ok: false,
      error:
        "Password must be at least 12 characters and include uppercase, lowercase, a number, and a special character.",
    };
  }
  return { ok: true };
}
