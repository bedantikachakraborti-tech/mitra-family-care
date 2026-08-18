import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SectionTitle, SoftCard } from "@/components/ui-kit";
import { caregiverByIdQuery } from "@/lib/care-data";
import { initialsOf } from "@/lib/caregiver-profile";
import { reviewsAboutQuery } from "@/lib/care-social";

export const Route = createFileRoute("/_authenticated/family/caregivers/$id")({
  head: () => ({
    meta: [
      { title: "Caregiver profile — Mitra" },
      {
        name: "description",
        content:
          "Read a caregiver's experience, skills, languages and past reviews before reaching out.",
      },
      { property: "og:title", content: "Caregiver profile — Mitra" },
      {
        property: "og:description",
        content: "Experience, skills and reviews — the details that help you decide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaregiverPublicProfile,
});

function CaregiverPublicProfile() {
  const { id } = useParams({ from: "/_authenticated/family/caregivers/$id" });
  const caregiver = useQuery(caregiverByIdQuery(id));
  const reviews = useQuery(reviewsAboutQuery(caregiver.data?.user_id));

  if (caregiver.isLoading) {
    return (
      <AppShell role="family" title="Caregiver profile">
        <SoftCard>
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </SoftCard>
      </AppShell>
    );
  }

  if (!caregiver.data) {
    return (
      <AppShell role="family" title="Caregiver profile">
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            We couldn't find that caregiver. They may have removed their profile.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-5 h-12 rounded-full">
            <Link to="/family/matches">Back to matches</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  const c = caregiver.data;

  return (
    <AppShell
      role="family"
      title={c.name}
      subtitle={c.headline}
      action={
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
          <Link to="/family/matches">Back to matches</Link>
        </Button>
      }
    >
      <SoftCard>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-primary font-display text-xl font-semibold text-primary-foreground">
            {c.initials || initialsOf(c.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">{c.name}</h1>
            <p className="text-sm text-muted-foreground">{c.headline}</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden /> {c.area || "Location not set"}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{c.about}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(c.skills ?? []).map((s) => (
            <Pill key={s} tone="sage">
              {s}
            </Pill>
          ))}
          {(c.languages ?? []).map((l) => (
            <Pill key={l}>{l}</Pill>
          ))}
          <Pill tone="sky">{c.years_experience} yrs experience</Pill>
          <Pill>₹{c.hourly_rate}/hr</Pill>
        </div>

        {(c.certifications ?? []).length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {c.certifications.map((cert) => (
              <li key={cert} className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>

      <SoftCard>
        <SectionTitle hint={`${reviews.data?.length ?? 0} reviews`}>Past reviews</SectionTitle>
        {reviews.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.data?.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border p-4">
                <p className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden />
                  ))}
                </p>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                {r.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.categories.map((cat) => (
                      <Pill key={cat} tone="sage">
                        {cat}
                      </Pill>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </AppShell>
  );
}
