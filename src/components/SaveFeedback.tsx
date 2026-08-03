"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SaveFeedbackState = {
  show: boolean;
  message: string;
  error?: boolean;
};

export function useSaveFeedback(durationMs = 3200) {
  const [feedback, setFeedback] = useState<SaveFeedbackState>({ show: false, message: "" });
  const [justSaved, setJustSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setFeedback({ show: false, message: "" });
    setJustSaved(false);
  }, []);

  const announce = useCallback(
    (message: string, opts?: { error?: boolean }) => {
      if (timer.current) clearTimeout(timer.current);
      const error = Boolean(opts?.error);
      setFeedback({ show: true, message, error });
      setJustSaved(!error);
      timer.current = setTimeout(() => {
        setFeedback({ show: false, message: "" });
        setJustSaved(false);
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { feedback, justSaved, announce, clear };
}

/** Floating / inline toast with checkmark — unmistakable success. */
export function SaveToast({
  feedback,
  className,
}: {
  feedback: SaveFeedbackState;
  className?: string;
}) {
  if (!feedback.show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-save-toast flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-card",
        feedback.error
          ? "border-coral/35 bg-coral/10 text-coral"
          : "border-save-ok/40 bg-gradient-to-r from-save-ok/15 via-gold/20 to-mustard/15 text-ink",
        className
      )}
    >
      {feedback.error ? (
        <span className="text-coral">!</span>
      ) : (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-save-ok text-white shadow-glow">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      )}
      <span>{feedback.message}</span>
    </div>
  );
}

/** Bottom-of-page sticky confirmation strip. */
export function SaveConfirmBar({
  show,
  message = "Saved successfully",
}: {
  show: boolean;
  message?: string;
}) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-save-toast">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-save-ok/40 bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-float">
        <CheckCircle2 className="h-5 w-5 text-gold" />
        {message}
      </div>
    </div>
  );
}

type SaveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  justSaved?: boolean;
  saving?: boolean;
  savedLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
  children?: ReactNode;
};

/** Primary Save control with pulse + checkmark success state. */
export function SaveButton({
  justSaved,
  saving,
  savedLabel = "Saved",
  children = "Save",
  className,
  disabled,
  ...props
}: SaveButtonProps) {
  return (
    <Button
      type="button"
      disabled={disabled || saving}
      className={cn(
        "relative min-w-[5.5rem] transition-all",
        justSaved && "animate-save-pulse border-save-ok/50 bg-save-ok text-white hover:bg-save-ok/90",
        className
      )}
      {...props}
    >
      {justSaved ? (
        <>
          <Check className="h-4 w-4" strokeWidth={3} />
          {savedLabel}
        </>
      ) : saving ? (
        "Saving…"
      ) : (
        children
      )}
    </Button>
  );
}
