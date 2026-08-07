/**
 * Transactional email — Resend when RESEND_API_KEY is set,
 * else optional SMTP (SMTP_HOST + SMTP_USER + SMTP_PASS).
 * Never pretends a send succeeded when the provider is missing or fails.
 */

export type EmailProvider = "resend" | "smtp";

export type EmailSendResult =
  | { sent: true; provider: EmailProvider; id?: string }
  | {
      sent: false;
      reason: "not_configured" | "send_failed";
      error?: string;
    };

export type InviteEmailPayload = {
  to: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
  invitedByName?: string | null;
};

function emailFrom(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Store thru Listing <onboarding@resend.dev>"
  );
}

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(host && user && pass);
}

export function emailConfigStatus(): {
  configured: boolean;
  provider: EmailProvider | null;
} {
  if (process.env.RESEND_API_KEY?.trim()) {
    return { configured: true, provider: "resend" };
  }
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return { configured: true, provider: "smtp" };
  }
  return { configured: false, provider: null };
}

function inviteSubject(orgName: string): string {
  return `You're invited to ${orgName} on Hammoq Store thru Listing`;
}

function inviteText(p: InviteEmailPayload): string {
  const by = p.invitedByName ? ` by ${p.invitedByName}` : "";
  return [
    `You've been invited${by} to join ${p.orgName} as ${p.role}.`,
    "",
    `Accept your invite (expires ${p.expiresAt}):`,
    p.inviteUrl,
    "",
    "If you did not expect this email, you can ignore it.",
  ].join("\n");
}

function inviteHtml(p: InviteEmailPayload): string {
  const by = p.invitedByName ? ` by <strong>${escapeHtml(p.invitedByName)}</strong>` : "";
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0d1b34">
  <p>You've been invited${by} to join <strong>${escapeHtml(p.orgName)}</strong> as <strong>${escapeHtml(p.role)}</strong>.</p>
  <p><a href="${escapeHtml(p.inviteUrl)}" style="display:inline-block;padding:10px 16px;background:#0d1b34;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Accept invite</a></p>
  <p style="font-size:13px;color:#5a6b82">Or paste this link:<br/><span style="word-break:break-all">${escapeHtml(p.inviteUrl)}</span></p>
  <p style="font-size:12px;color:#5a6b82">Expires ${escapeHtml(p.expiresAt)}. If you did not expect this, ignore this email.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg =
        json.error?.message || json.message || `Resend HTTP ${res.status}`;
      console.error("[email] resend failed", { status: res.status, message: msg });
      return { sent: false, reason: "send_failed", error: msg };
    }

    return { sent: true, provider: "resend", id: json.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resend request failed";
    console.error("[email] resend error", msg);
    return { sent: false, reason: "send_failed", error: msg };
  }
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) {
    return { sent: false, reason: "not_configured" };
  }

  // SMTP path is reserved for deployments that add nodemailer themselves.
  // Prefer RESEND_API_KEY for zero-dep sends in this repo.
  void opts;
  return {
    sent: false,
    reason: "send_failed",
    error:
      "SMTP detected but nodemailer is not bundled. Set RESEND_API_KEY + EMAIL_FROM instead.",
  };
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<EmailSendResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(opts);
  }
  if (process.env.SMTP_HOST?.trim()) {
    return sendViaSmtp(opts);
  }
  return { sent: false, reason: "not_configured" };
}

export async function sendInviteEmail(
  payload: InviteEmailPayload
): Promise<EmailSendResult> {
  return sendEmail({
    to: payload.to,
    subject: inviteSubject(payload.orgName),
    text: inviteText(payload),
    html: inviteHtml(payload),
  });
}
