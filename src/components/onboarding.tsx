import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill } from "@/components/ui-kit";

export function Field({
  label,
  id,
  placeholder,
}: {
  label: string;
  id: string;
  placeholder: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input id={id} placeholder={placeholder} className="mt-2 h-12 rounded-2xl" />
    </div>
  );
}

export function OnboardingLayout({
  eyebrow,
  title,
  subtitle,
  steps,
  current,
  backTo,
  nextTo,
  nextLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: string[];
  current: number;
  backTo: string;
  nextTo: string;
  nextLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warm-gradient px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="flex items-center gap-2">
          <MitraMark className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">Mitra</span>
        </Link>

        <div className="mt-8">
          <Pill tone="honey">{eyebrow}</Pill>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>

        <ol className="mt-6 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                i === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">
          {children}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button asChild variant="ghost" size="lg" className="h-13 rounded-full">
            <Link to={backTo}>Back</Link>
          </Button>
          <Button asChild size="lg" className="h-13 rounded-full px-8 text-base">
            <Link to={nextTo}>{nextLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
