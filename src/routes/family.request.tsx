import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SoftCard, SectionTitle } from "@/components/ui-kit";

export const Route = createFileRoute("/family/request")({
  head: () => ({
    meta: [
      { title: "New care request — Mitra" },
      {
        name: "description",
        content: "Describe the care you're looking for and Mitra will suggest caregivers who fit.",
      },
      { property: "og:title", content: "New care request — Mitra" },
      { property: "og:description", content: "Tell us what kind of help you need, and when." },
    ],
  }),
  component: CareRequest,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const times = ["Mornings", "Afternoons", "Evenings", "Overnight", "Full day"];
const support = [
  "Companionship",
  "Medication",
  "Mobility",
  "Cooking",
  "Housekeeping",
  "Doctor visits",
];

function CareRequest() {
  return (
    <AppShell
      role="family"
      title="New care request"
      subtitle="A few details so we can suggest the right people."
    >
      <SoftCard>
        <SectionTitle>Who is this for?</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="person" className="text-sm font-semibold">
              Person
            </Label>
            <Input id="person" defaultValue="Kamala Ramesh" className="mt-2 h-12 rounded-2xl" />
          </div>
          <div>
            <Label htmlFor="area" className="text-sm font-semibold">
              Neighbourhood
            </Label>
            <Input
              id="area"
              defaultValue="Indiranagar, Bengaluru"
              className="mt-2 h-12 rounded-2xl"
            />
          </div>
        </div>
      </SoftCard>

      <SoftCard>
        <SectionTitle>When do you need support?</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              className="min-h-11 min-w-11 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {d}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {times.map((t) => (
            <button
              key={t}
              type="button"
              className="min-h-11 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {t}
            </button>
          ))}
        </div>
      </SoftCard>

      <SoftCard>
        <SectionTitle>What kind of support?</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {support.map((s) => (
            <button
              key={s}
              type="button"
              className="min-h-11 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-6">
          <Label htmlFor="notes" className="text-sm font-semibold">
            Anything else worth knowing?
          </Label>
          <Textarea
            id="notes"
            rows={4}
            className="mt-2 rounded-2xl"
            placeholder="She's most comfortable with someone who speaks Kannada and doesn't rush her in the mornings."
          />
        </div>
      </SoftCard>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" size="lg" className="h-13 rounded-full">
          Save as draft
        </Button>
        <Button asChild size="lg" className="h-13 rounded-full px-8 text-base">
          <Link to="/family/matches">See suggested caregivers</Link>
        </Button>
      </div>
    </AppShell>
  );
}
