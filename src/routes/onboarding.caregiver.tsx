import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Field, OnboardingLayout } from "@/components/onboarding";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
