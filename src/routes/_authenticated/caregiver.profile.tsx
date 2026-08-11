import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle } from "@/components/ui-kit";
import { caregiver } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/caregiver/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Mitra" },
      {
        name: "description",
        content: "Priya Nair's caregiver profile: experience, skills, languages and availability.",
      },
      { property: "og:title", content: "Caregiver profile — Mitra" },
      { property: "og:description", content: "How families get to know a caregiver on Mitra." },
    ],
  }),
  component: CaregiverProfile,
});

function CaregiverProfile() {
  return (
    <AppShell
      role="caregiver"
      title="My profile"
      subtitle="This is what families see before they reach out."
      action={
        <Button size="lg" variant="outline" className="h-12 rounded-full px-6">
          Edit profile
        </Button>
      }
    >
      <SoftCard>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 sm:flex sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-primary font-display text-xl font-semibold text-primary-foreground">
            PN
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{caregiver.name}</h2>
            <p className="text-sm text-muted-foreground">
              {caregiver.role} · {caregiver.experience}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-primary" aria-hidden /> {caregiver.rating} (
                {caregiver.reviews})
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden /> {caregiver.location}
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-4 w-4 text-primary" aria-hidden /> Verified
              </span>
            </div>
          </div>
        </div>
        <p className="mt-5 text-sm text-muted-foreground sm:text-base">{caregiver.about}</p>
      </SoftCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SoftCard>
          <SectionTitle>Skills</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {caregiver.skills.map((s) => (
              <Pill key={s} tone="sage">
                {s}
              </Pill>
            ))}
          </div>
          <SectionTitle>{""}</SectionTitle>
          <p className="text-sm font-semibold">Languages</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {caregiver.languages.map((l) => (
              <Pill key={l}>{l}</Pill>
            ))}
          </div>
        </SoftCard>

        <SoftCard>
          <SectionTitle>Certifications</SectionTitle>
          <ul className="space-y-2 text-sm">
            {caregiver.certifications.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl bg-honey p-4 text-honey-foreground">
            <p className="text-sm font-semibold">Availability</p>
            <p className="mt-1 text-sm opacity-90">{caregiver.availability}</p>
          </div>
        </SoftCard>
      </div>
    </AppShell>
  );
}
