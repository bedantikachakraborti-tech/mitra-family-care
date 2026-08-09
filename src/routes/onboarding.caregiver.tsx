import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MitraMark } from "@/components/mitra-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pill } from "@/components/ui-kit";

export const Route = createFileRoute("/onboarding/caregiver")({
  head: () => ({
    meta: [
      { title: "Caregiver onboarding — Mitra" },
      { name: "description", content: "Set up your caregiver profile on Mitra in a few calm steps." },
      { property: "og:title", content: "Caregiver onboarding — Mitra" },
      { property: "og:description", content: "Tell families who you are and how you like to work." },
    ],
  }),
  component: CaregiverOnboarding,
});

const steps = ["About you", "Skills & experience", "Availability"];
const skillOptions = [
  "Elder companionship",
  "Dementia care",
  "Medication management",
  "Mobility support",
  "Post-surgery recovery",
  "Meal preparation",
  "Overnight care",
];

function CaregiverOnboarding() {
  return (
    <OnboardingLayout
      eyebrow="Caregiver"
      title="Let's build your profile"
      subtitle="Families read this before they reach out. Write it the way you'd introduce yourself at the door."
      steps={steps}
      current={0}
      backTo="/role"
      nextTo="/caregiver"
      nextLabel="Go to my dashboard"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" id="name" placeholder="Priya Nair" />
        <Field label="City" id="city" placeholder="Bengaluru" />
        <Field label="Years of experience" id="years" placeholder="6" />
        <Field label="Languages you speak" id="lang" placeholder="Malayalam, English, Kannada" />
      </div>

      <div className="mt-6">
        <Label htmlFor="about" className="text-sm font-semibold">
          A little about you
        </Label>
        <Textarea
          id="about"
          rows={4}
          className="mt-2 rounded-2xl"
          placeholder="I care for elders the way I cared for my own grandmother — patiently, and with a strict eye on medication times."
        />
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold">What kind of care do you offer?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skillOptions.map((s) => (
            <button
              key={s}
              type="button"
              className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-sage p-5 text-sage-foreground">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Check className="h-4 w-4" aria-hidden /> Verification
        </p>
        <p className="mt-1 text-sm opacity-90">
          We'll ask for an ID and one reference before your profile goes live. It usually takes a day or two.
        </p>
      </div>
    </OnboardingLayout>
  );
}

export function Field({ label, id, placeholder }: { label: string; id: string; placeholder: string }) {
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
  children: React.ReactNode;
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
                i === current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-7">{children}</div>

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
