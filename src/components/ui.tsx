import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "icon";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold transition disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        size === "sm" && "h-8 px-2.5 text-xs rounded-lg",
        size === "md" && "h-10 px-3.5 text-sm rounded-xl",
        size === "lg" && "h-12 px-5 text-sm rounded-xl",
        size === "icon" && "h-10 w-10 rounded-xl",
        variant === "primary" && "bg-ink text-white hover:bg-ink/90",
        variant === "accent" && "bg-accent text-accent-ink hover:brightness-95 shadow-glow",
        variant === "secondary" && "bg-brand-orange text-white hover:bg-brand-orange/90",
        variant === "success" && "bg-mustard text-ink hover:brightness-95",
        variant === "danger" && "bg-coral text-white hover:bg-coral/90",
        variant === "outline" &&
          "border border-ink/15 bg-white/70 backdrop-blur hover:bg-white text-ink",
        variant === "ghost" && "hover:bg-ink/5 text-ink",
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-ink/10 bg-white/80 px-3 text-sm outline-none backdrop-blur focus:border-ink/30 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-ink/10 bg-white/80 px-3 py-2 text-sm outline-none backdrop-blur focus:border-ink/30 focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/8 bg-white/75 shadow-card backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "orange" | "red" | "purple" | "yellow";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        tone === "neutral" && "bg-ink/5 text-ink/70",
        tone === "blue" && "bg-ink/8 text-ink",
        tone === "green" && "bg-mustard/20 text-ink",
        tone === "orange" && "bg-brand-orange/15 text-brand-orange",
        tone === "red" && "bg-coral/15 text-coral",
        tone === "purple" && "bg-ink/10 text-ink",
        tone === "yellow" && "bg-accent/35 text-ink",
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
    </div>
  );
}
