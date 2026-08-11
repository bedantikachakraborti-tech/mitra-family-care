import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Pill, SectionTitle, SoftCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { rankCaregivers } from "@/lib/ai.functions";
import { ensurePlan, matchesQuery, saveMatches, selectCaregiver } from "@/lib/care-data";
import { useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/family/matches")({
  head: () => ({
    meta: [
      { title: "Suggested caregivers — Mitra" },
      {
        name: "description",
        content:
          "Mitra suggests caregivers whose skills, availability and languages fit your care request. You decide who to go with.",
      },
      { property: "og:title", content: "Suggested caregivers — Mitra" },
      { property: "og:description", content: "Suggestions to consider — the choice stays yours." },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { request, caregivers } = useCareContext();
  const matches = useQuery(matchesQuery(request?.id));

  const rank = useServerFn(rankCaregivers);

  const findMatches = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error("Save a care request first.");
      const result = await rank({
        data: {
          requirements: request.structured as unknown as Record<string, unknown>,
          caregivers: caregivers.map((c) => ({
            id: c.id,
            name: c.name,
            headline: c.headline,
            about: c.about,
            years_experience: c.years_experience,
            languages: c.languages,
            skills: c.skills,
            area: c.area,
            availability: c.availability,
            hourly_rate: c.hourly_rate,
          })),
        },
      });
      await saveMatches(request.id, result);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["matches"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const choose = useMutation({
    mutationFn: async (caregiverId: string) => {
      if (!request) throw new Error("No care request yet.");
      await selectCaregiver(request.id, caregiverId);
      await ensurePlan(request.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      toast.success("Caregiver selected — you now share a care dashboard");
      navigate({ to: "/shared" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!request) {
    return (
      <AppShell role="family" title="Suggested caregivers">
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            Describe what kind of help you're looking for first, and Mitra will suggest caregivers
            whose experience fits.
          </p>
          <Button asChild size="lg" className="mt-5 h-13 rounded-full">
            <Link to="/family/request">Start a care request</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  const rows = (matches.data ?? []).map((m) => ({
    match: m,
    caregiver: caregivers.find((c) => c.id === m.caregiver_id),
  }));

  return (
    <AppShell
      role="family"
      title="Caregivers who could fit"
      subtitle={`Based on your request for ${request.person_name || "your family member"}.`}
      action={
        <Button
          size="lg"
          className="h-13 rounded-full"
          disabled={findMatches.isPending || caregivers.length === 0}
          onClick={() => findMatches.mutate()}
        >
          {findMatches.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {rows.length ? "Refresh suggestions" : "Find matches"}
        </Button>
      }
    >
      <SoftCard tone="honey">
        <p className="text-sm">
          These are suggestions based on skills, availability, languages and what you told us. Mitra
          can't tell you whether someone is trustworthy — please meet them and ask your own
          questions before deciding.
        </p>
      </SoftCard>

      {rows.length === 0 && (
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            No suggestions yet. Tap “Find matches” and Mitra will read your request against every
            caregiver profile.
          </p>
        </SoftCard>
      )}

      {rows.map(({ match, caregiver }) =>
        caregiver ? (
          <SoftCard key={match.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary font-semibold text-secondary-foreground">
                  {caregiver.initials}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">{caregiver.name}</h3>
                  <p className="truncate text-sm text-muted-foreground">{caregiver.headline}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-2xl font-semibold">{match.score}%</p>
                <p className="text-xs text-muted-foreground">practical fit</p>
              </div>
            </div>

            <p className="mt-4 text-sm">{match.rationale}</p>
            {match.considerations && (
              <p className="mt-2 text-sm text-muted-foreground">
                Worth asking: {match.considerations}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="sage">{caregiver.area}</Pill>
              <Pill tone="sky">{caregiver.availability}</Pill>
              <Pill>{caregiver.years_experience} yrs experience</Pill>
              <Pill>₹{caregiver.hourly_rate}/hr</Pill>
              {caregiver.languages.map((language) => (
                <Pill key={language}>{language}</Pill>
              ))}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button asChild variant="ghost" size="lg" className="h-12 rounded-full">
                <Link to="/caregiver/profile">View profile</Link>
              </Button>
              <Button
                size="lg"
                className="h-12 rounded-full px-6"
                disabled={choose.isPending}
                onClick={() => choose.mutate(caregiver.id)}
              >
                {request.selected_caregiver_id === caregiver.id
                  ? "Selected"
                  : `Choose ${caregiver.name.split(" ")[0]}`}
              </Button>
            </div>
          </SoftCard>
        ) : null,
      )}
    </AppShell>
  );
}
