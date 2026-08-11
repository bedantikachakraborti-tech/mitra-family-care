import { createFileRoute } from "@tanstack/react-router";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field, OnboardingLayout } from "@/components/onboarding";

export const Route = createFileRoute("/_authenticated/onboarding/family")({
  head: () => ({
    meta: [
      { title: "Family onboarding — Mitra" },
      {
        name: "description",
        content: "Tell Mitra about the person you care for so we can shape the right support.",
      },
      { property: "og:title", content: "Family onboarding — Mitra" },
      {
        property: "og:description",
        content: "A few gentle questions about the person you care for.",
      },
    ],
  }),
  component: FamilyOnboarding,
});

const needs = [
  "Companionship",
  "Medication reminders",
  "Mobility support",
  "Light cooking",
  "Housekeeping",
  "Doctor visits",
  "Overnight care",
];

function FamilyOnboarding() {
  return (
    <OnboardingLayout
      eyebrow="Family"
      title="Tell us about the person you care for"
      subtitle="Only what you're comfortable sharing. It helps us suggest caregivers who genuinely fit."
      steps={["Your family", "Their needs", "Schedule"]}
      current={0}
      backTo="/role"
      nextTo="/family/profile"
      nextLabel="Go to family home"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" id="you" placeholder="Anita Ramesh" />
        <Field label="Your relationship" id="rel" placeholder="Daughter" />
        <Field label="Their name" id="them" placeholder="Kamala Ramesh" />
        <Field label="Their age" id="age" placeholder="78" />
        <Field label="Neighbourhood" id="area" placeholder="Indiranagar, Bengaluru" />
        <Field label="Languages at home" id="lang" placeholder="Kannada, English" />
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold">What kind of support would help most?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {needs.map((n) => (
            <button
              key={n}
              type="button"
              className="min-h-11 rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="about-them" className="text-sm font-semibold">
          What should a caregiver know about them?
        </Label>
        <Textarea
          id="about-them"
          rows={4}
          className="mt-2 rounded-2xl"
          placeholder="Amma loves filter coffee at 7am, morning walks, and long Sunday phone calls with her sister."
        />
      </div>

      <div className="mt-8 rounded-2xl bg-sky p-5 text-sky-foreground">
        <p className="text-sm font-semibold">You can invite the rest of the family later</p>
        <p className="mt-1 text-sm opacity-90">
          Siblings and doctors can join the care circle so everyone sees the same plan.
        </p>
      </div>
    </OnboardingLayout>
  );
}
