import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SoftCard({
  className,
  children,
  tone = "card",
}: {
  className?: string;
  children: ReactNode;
  tone?: "card" | "sage" | "honey" | "sky" | "muted";
}) {
  const tones = {
    card: "bg-card border border-border",
    sage: "bg-sage text-sage-foreground border border-transparent",
    honey: "bg-honey text-honey-foreground border border-transparent",
    sky: "bg-sky text-sky-foreground border border-transparent",
    muted: "bg-muted border border-transparent",
  } as const;

  return (
    <section className={cn("rounded-3xl p-5 shadow-soft sm:p-6", tones[tone], className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 truncate text-lg font-semibold">{children}</h2>
      {hint ? <span className="shrink-0 text-sm text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "sage" | "honey" | "sky";
}) {
  const tones = {
    muted: "bg-secondary text-secondary-foreground",
    sage: "bg-sage text-sage-foreground",
    honey: "bg-honey text-honey-foreground",
    sky: "bg-sky text-sky-foreground",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
