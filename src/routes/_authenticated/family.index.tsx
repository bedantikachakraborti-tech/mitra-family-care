import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, MessageCircleHeart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { careRecipient, todaysTasks, updates } from "@/lib/demo-data";

export const Route = createFileRoute("/_authenticated/family/")({
  head: () => ({
    meta: [
      { title: "Family home — Mitra" },
      {
        name: "description",
        content: "See how Amma's day is going, who's with her, and what's coming next.",
      },
      { property: "og:title", content: "Family home — Mitra" },
      { property: "og:description", content: "A warm daily picture of how care is going." },
    ],
  }),
  component: FamilyDashboard,
});

function FamilyDashboard() {
  const next = todaysTasks.find((t) => !t.done);

  return (
    <AppShell
      role="family"
      title="Hello, Anita"
      subtitle={`How ${careRecipient.name.split(" ")[0]}'s day is going`}
      action={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/family/request">New care request</Link>
        </Button>
      }
    >
      <SoftCard tone="sage">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium opacity-80">Right now</p>
            <p className="mt-1 font-display text-2xl font-semibold">
              Priya is with Amma · next: {next?.title ?? "resting"}
            </p>
            <p className="mt-1 text-sm opacity-90">Scheduled for {next?.time ?? "—"}</p>
          </div>
          <Button asChild variant="secondary" size="lg" className="h-12 rounded-full px-6">
            <Link to="/shared">Open care circle</Link>
          </Button>
        </div>
      </SoftCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="This week" value="5 visits" hint="Mon – Fri, 8:00–18:00" />
        <StatTile label="Medication" value="On time" hint="14 of 14 doses" />
        <StatTile label="Mood" value="Bright" hint="Priya's last 3 notes" />
      </div>

      <SoftCard>
        <SectionTitle
          hint={
            <Link to="/shared" className="text-primary">
              See all
            </Link>
          }
        >
          Latest updates
        </SectionTitle>
        <ul className="space-y-3">
          {updates.slice(0, 2).map((u) => (
            <li key={u.id} className="rounded-2xl border border-border p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <p className="min-w-0 text-sm font-semibold">{u.author}</p>
                <Pill tone="honey">{u.mood}</Pill>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{u.text}</p>
              <p className="mt-2 text-xs text-muted-foreground">{u.time}</p>
            </li>
          ))}
        </ul>
      </SoftCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          to="/care-plan"
          icon={CalendarHeart}
          title="Care plan"
          text="The daily rhythm everyone follows."
        />
        <QuickLink
          to="/family/matches"
          icon={MessageCircleHeart}
          title="Caregiver matches"
          text="3 caregivers suggested for weekends."
        />
      </div>
    </AppShell>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: string;
  icon: typeof CalendarHeart;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky text-sky-foreground">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{text}</span>
      </span>
      <ArrowRight
        className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}
