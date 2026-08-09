import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Sparkles, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard } from "@/components/ui-kit";
import { matches } from "@/lib/demo-data";

export const Route = createFileRoute("/family/matches")({
  head: () => ({
    meta: [
      { title: "Suggested caregivers — Mitra" },
      { name: "description", content: "Caregivers suggested for your care request, with languages, skills and distance." },
      { property: "og:title", content: "Suggested caregivers — Mitra" },
      { property: "og:description", content: "Three caregivers who fit the care you described." },
    ],
  }),
  component: Matches,
});

function Matches() {
  return (
    <AppShell
      role="family"
      title="Suggested caregivers"
      subtitle="Based on your request for weekday mornings in Indiranagar."
      action={
        <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
          <Link to="/family/request">Edit request</Link>
        </Button>
      }
    >
      <SoftCard tone="sky">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" aria-hidden /> How matching works
        </p>
        <p className="mt-2 text-sm opacity-90">
          We look at languages, skills, distance and availability. You always choose — Mitra only suggests.
        </p>
      </SoftCard>

      <div className="space-y-4">
        {matches.map((m) => (
          <article key={m.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl bg-secondary font-display text-lg font-semibold">
                {m.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{m.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {m.experience} experience · {m.rate}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden /> {m.distance}
                </p>
              </div>
              <span className="shrink-0 rounded-2xl bg-sage px-3 py-2 text-center text-sage-foreground">
                <span className="block font-display text-xl leading-none font-semibold">{m.score}</span>
                <span className="text-[10px] font-medium tracking-wide uppercase">match</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {m.highlights.map((h) => (
                <Pill key={h} tone="honey">
                  {h}
                </Pill>
              ))}
              {m.languages.map((l) => (
                <Pill key={l}>{l}</Pill>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 flex-1 rounded-full">
                Request an intro call
              </Button>
              <Button variant="outline" size="lg" className="h-12 flex-1 rounded-full">
                <Star className="h-4 w-4" aria-hidden />
                Save for later
              </Button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
