import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, MessageCircleHeart } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { useMyProfile } from "@/lib/auth";
import { statusLabel } from "@/lib/care-types";
import { logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/family/")({
  head: () => ({
    meta: [
      { title: "Family home — Mitra" },
      {
        name: "description",
        content: "See how today's care is going, who's helping, and what's coming next.",
      },
      { property: "og:title", content: "Family home — Mitra" },
      { property: "og:description", content: "A warm daily picture of how care is going." },
    ],
  }),
  component: FamilyDashboard,
});

function FamilyDashboard() {
  const profile = useMyProfile();
  const { request, caregiver, matchActive, tasks, logs, isLoading } = useCareContext();
  // A former caregiver is history, never the current connection.
  const connectionEnded = Boolean(request?.selected_caregiver_id) && !matchActive;
  const today = tasksForDay(tasks);
  const done = today.filter((t) => logFor(logs, t.id)?.status === "done").length;
  const next = today.find((t) => (logFor(logs, t.id)?.status ?? "pending") === "pending");
  const notes = today
    .map((t) => ({ task: t, log: logFor(logs, t.id) }))
    .filter((row) => row.log?.note);
  const firstName = request?.person_name?.split(" ")[0] ?? "your family";

  return (
    <AppShell
      role="family"
      title={`Hello${profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}`}
      subtitle={request ? `How ${firstName}'s day is going` : "Let's set up care together"}
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
              {caregiver
                ? `${caregiver.name} is your current care connection`
                : connectionEnded
                  ? "Your care connection has ended."
                  : "No caregiver selected yet"}
              {caregiver && next ? ` · next: ${next.title}` : ""}
            </p>
            <p className="mt-1 text-sm opacity-90">
              {connectionEnded
                ? "Past tasks, notes and messages stay saved as historical care records."
                : next
                  ? `Scheduled for ${next.scheduled_time || next.time_of_day}`
                  : isLoading
                    ? "Loading today's plan…"
                    : "Nothing else scheduled for today."}
            </p>
          </div>
          <Button asChild variant="secondary" size="lg" className="h-12 rounded-full px-6">
            <Link to={caregiver ? "/shared" : "/family/matches"}>
              {caregiver ? "Open care circle" : connectionEnded ? "Choose a new caregiver" : "See matches"}
            </Link>
          </Button>
        </div>
      </SoftCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Today"
          value={`${done} of ${today.length} done`}
          hint="Updated by your caregiver"
        />
        <StatTile
          label="Care plan"
          value={`${tasks.length} routines`}
          hint={tasks.length ? "Shared with your caregiver" : "Not created yet"}
        />
        <StatTile
          label="Caregiver"
          value={caregiver?.name.split(" ")[0] ?? "—"}
          hint={caregiver?.area || "Choose from your matches"}
        />
      </div>

      <SoftCard>
        <SectionTitle
          hint={
            <Link to="/shared" className="text-primary">
              See all
            </Link>
          }
        >
          Today's tasks
        </SectionTitle>
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks scheduled today.{" "}
            <Link to="/care-family" className="text-primary">
              Build the care plan
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {today.map((task) => {
              const log = logFor(logs, task.id);
              const status = log?.status ?? "pending";
              return (
                <li key={task.id} className="rounded-2xl border border-border p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <p className="min-w-0 text-sm font-semibold">{task.title}</p>
                    <Pill tone={status === "done" ? "sage" : status === "postponed" ? "honey" : "sky"}>
                      {status === "done" ? "Complete" : status === "postponed" ? "Postponed" : "Open"}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.scheduled_time || task.time_of_day} · {statusLabel(log)}
                  </p>
                  {log?.note && <p className="mt-2 text-sm">“{log.note}”</p>}
                </li>
              );
            })}
          </ul>
        )}
      </SoftCard>

      {notes.length > 0 && (
        <SoftCard>
          <SectionTitle>Caregiver notes today</SectionTitle>
          <ul className="space-y-3">
            {notes.map(({ task, log }) => (
              <li key={task.id} className="rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{log?.note}</p>
              </li>
            ))}
          </ul>
        </SoftCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <QuickLink
          to="/care-family"
          icon={CalendarHeart}
          title="Care plan"
          text="The daily rhythm everyone follows."
        />
        <QuickLink
          to="/family/matches"
          icon={MessageCircleHeart}
          title="Caregiver matches"
          text="Review the caregivers Mitra suggested."
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
