import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Timer } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { ReviewPanel } from "@/components/review-panel";
import { useRole } from "@/lib/auth";
import { summaryQuery } from "@/lib/care-data";
import { DAY_LABELS, statusLabel, type DayKey } from "@/lib/care-types";
import { logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/shared")({
  head: () => ({
    meta: [
      { title: "Care circle — Mitra" },
      {
        name: "description",
        content:
          "One shared workspace for the family and the matched caregiver: today's progress, the care plan and the notes that matter.",
      },
      { property: "og:title", content: "Care circle — Mitra" },
      { property: "og:description", content: "The family and caregiver, on the same page." },
    ],
  }),
  component: SharedDashboard,
});

function SharedDashboard() {
  const role = useRole();
  const { request, caregiver, tasks, logs, planId, date } = useCareContext();
  const summary = useQuery(summaryQuery(planId ?? undefined, date));

  // The shared workspace only exists while a family and a caregiver are matched.
  if (!request || !caregiver) {
    const ended = Boolean(request && request.selected_caregiver_id);
    return (
      <AppShell role={role} title="Care circle">
        <SoftCard>
          <h2 className="text-lg font-semibold">
            {ended ? "Your care connection has ended." : "No active care connection yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ended
              ? role === "family"
                ? "Past tasks, notes and messages are kept as historical care records. Choose a new caregiver to start a new care circle."
                : "Past tasks, notes and messages are kept as historical care records."
              : "This shared workspace opens once a family and a caregiver are matched. You'll both see the same plan, progress and notes here."}
          </p>
          {role === "family" && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 rounded-full px-6">
                <Link to="/family/matches">Choose a new caregiver</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-13 rounded-full">
                <Link to="/family/request">Start a care request</Link>
              </Button>
            </div>
          )}
        </SoftCard>
      </AppShell>
    );
  }

  const today = tasksForDay(tasks);
  const done = today.filter((t) => logFor(logs, t.id)?.status === "done").length;
  const upcoming = today.filter((t) => (logFor(logs, t.id)?.status ?? "pending") === "pending");
  const notes = logs.filter((l) => l.note.trim().length > 0);

  return (
    <AppShell
      role="family"
      title="Care circle"
      subtitle={`${request.person_name || "Your family member"} · shared with ${caregiver.name}`}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Today's progress" value={`${done} of ${today.length}`} hint="Marked complete" />
        <StatTile
          label="Still to come"
          value={`${upcoming.length}`}
          hint={upcoming[0]?.title ?? "Nothing pending"}
        />
        <StatTile label="Caregiver" value={caregiver.name.split(" ")[0] ?? ""} hint={caregiver.headline} />
      </div>

      <SoftCard>
        <SectionTitle>Who's involved</SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2">
          <Person name={request.person_name || "Family member"} role="Receiving care" initials="•" />
          <Person name={caregiver.name} role={caregiver.headline} initials={caregiver.initials} />
        </ul>
      </SoftCard>

      <SoftCard>
        <SectionTitle hint={`${today.length} today`}>Today</SectionTitle>
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tasks scheduled for today yet.{" "}
            <Link to="/care-family" className="underline">
              Build the care plan
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-2">
            {today.map((task) => {
              const log = logFor(logs, task.id);
              const status = log?.status ?? "pending";
              return (
                <li
                  key={task.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary">
                    {status === "done" ? (
                      <CheckCircle2 className="h-4.5 w-4.5" aria-hidden />
                    ) : (
                      <Timer className="h-4.5 w-4.5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{task.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {task.scheduled_time || task.time_of_day} · {statusLabel(log)}
                    </span>
                  </span>
                  <Pill tone={status === "done" ? "sage" : "muted"}>{task.category}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </SoftCard>

      <SoftCard tone="honey">
        <SectionTitle hint="From today's records">Summary</SectionTitle>
        {summary.data?.content ? (
          <p className="text-sm opacity-90">{summary.data.content}</p>
        ) : (
          <p className="text-sm opacity-90">
            No summary yet today. The caregiver can write one from the{" "}
            <Link to="/assistant" className="underline">
              assistant
            </Link>
            .
          </p>
        )}
      </SoftCard>

      <SoftCard>
        <SectionTitle hint="From the caregiver">Care notes</SectionTitle>
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes recorded today.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => {
              const task = tasks.find((t) => t.id === note.task_id);
              return (
                <li key={note.id} className="rounded-2xl border border-border p-4">
                  <p className="truncate text-sm font-semibold">{task?.title ?? "Task"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{note.note}</p>
                </li>
              );
            })}
          </ul>
        )}
      </SoftCard>

      <SoftCard>
        <SectionTitle hint="Confirmed by the family">The care plan</SectionTitle>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plan confirmed yet.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-2xl border border-border p-4">
                <p className="truncate font-medium">{task.title}</p>
                {task.details && (
                  <p className="mt-1 text-sm text-muted-foreground">{task.details}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="sky">{task.scheduled_time || task.time_of_day}</Pill>
                  {task.days.map((d) => (
                    <Pill key={d}>{DAY_LABELS[d as DayKey] ?? d}</Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
      <ReviewPanel requestId={request.id} />
    </AppShell>
  );
}

function Person({ name, role, initials }: { name: string; role: string; initials: string }) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-sm font-semibold">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        <span className="block truncate text-sm text-muted-foreground">{role}</span>
      </span>
    </li>
  );
}
