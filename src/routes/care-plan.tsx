import { createFileRoute } from "@tanstack/react-router";
import { Clock, Pill as PillIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle } from "@/components/ui-kit";
import { carePlanSections, careRecipient, medications } from "@/lib/demo-data";

export const Route = createFileRoute("/care-plan")({
  head: () => ({
    meta: [
      { title: "Care plan — Mitra" },
      { name: "description", content: "Kamala's daily care plan: mornings, afternoons and evenings, plus medication timings." },
      { property: "og:title", content: "Care plan — Mitra" },
      { property: "og:description", content: "The daily rhythm everyone in the care circle follows." },
    ],
  }),
  component: CarePlan,
});

function CarePlan() {
  return (
    <AppShell
      role="caregiver"
      title="Care plan"
      subtitle={`${careRecipient.name} · updated by Anita, 2 days ago`}
      action={
        <Button size="lg" variant="outline" className="h-12 rounded-full px-6">
          Suggest a change
        </Button>
      }
    >
      <SoftCard tone="honey">
        <h2 className="text-lg font-semibold">The short version</h2>
        <p className="mt-2 text-sm opacity-90">
          Slow mornings, a walk if the weather allows, soft low-salt food, and never rush her on the stairs.
        </p>
      </SoftCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {carePlanSections.map((section) => (
          <SoftCard key={section.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="min-w-0 truncate text-lg font-semibold">{section.title}</h2>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {section.window}
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </SoftCard>
        ))}
      </div>

      <SoftCard>
        <SectionTitle hint="Reviewed by Dr. Meera Iyer">Medication</SectionTitle>
        <ul className="space-y-2">
          {medications.map((m) => (
            <li
              key={m.name}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky text-sky-foreground">
                <PillIcon className="h-4.5 w-4.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {m.name} · {m.dose}
                </span>
                <span className="block truncate text-sm text-muted-foreground">{m.when}</span>
              </span>
              <Pill tone="sage">Active</Pill>
            </li>
          ))}
        </ul>
      </SoftCard>

      <SoftCard>
        <SectionTitle>Good to know</SectionTitle>
        <p className="text-sm text-muted-foreground">{careRecipient.notes}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {careRecipient.languages.map((l) => (
            <Pill key={l}>{l}</Pill>
          ))}
        </div>
      </SoftCard>
    </AppShell>
  );
}
