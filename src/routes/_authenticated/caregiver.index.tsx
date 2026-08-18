import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { TaskRow, useTaskSave } from "@/components/task-checklist";
import { useCareRealtime } from "@/lib/care-social";
import { logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/caregiver/")({
  head: () => ({
    meta: [
      { title: "Today's Care — Mitra" },
      {
        name: "description",
        content: "Today's care tasks, timings and notes — mark things complete as the day goes.",
      },
      { property: "og:title", content: "Today's Care — Mitra" },
      { property: "og:description", content: "A caregiver's calm view of the day ahead." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaregiverDashboard,
});

function CaregiverDashboard() {
  const { request, caregiver, matchActive, tasks, logs, date, isLoading } = useCareContext();

  // No active care connection means no active tasks flow through it. History stays.
  const today = matchActive ? tasksForDay(tasks) : [];
  const done = today.filter((t) => logFor(logs, t.id)?.status === "done").length;
  const next = today.find((t) => (logFor(logs, t.id)?.status ?? "pending") === "pending");

  useCareRealtime(request?.id);

  const save = useTaskSave({ request, logs, date });

  if (!isLoading && !matchActive) {
    const ended = Boolean(request?.selected_caregiver_id);
    return (
      <AppShell role="caregiver" title="Today's care">
        <SoftCard>
          <h2 className="text-lg font-semibold">
            {ended ? "Your care connection has ended." : "No active care connection yet"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ended
              ? "There are no active tasks to complete. Past tasks, notes and messages stay saved as historical care records."
              : "Once a family matches with you, today's tasks will appear here."}
          </p>
          <Button asChild size="lg" variant="outline" className="mt-5 h-12 rounded-full">
            <Link to="/caregiver/profile">Update my profile</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  if (!isLoading && today.length === 0) {
    return (
      <AppShell
        role="caregiver"
        title="Today's care"
        subtitle={request?.person_name ? `With ${request.person_name}` : ""}
      >
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            There's no care plan for today yet. Once the family confirms a plan, today's tasks will
            appear here.
          </p>
          <Button asChild size="lg" variant="outline" className="mt-5 h-12 rounded-full">
            <Link to="/care-caregiver">See the care plan</Link>
          </Button>
        </SoftCard>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="caregiver"
      title={caregiver ? `Good day, ${caregiver.name.split(" ")[0]}` : "Today's care"}
      subtitle={
        request?.person_name
          ? `Today with ${request.person_name}${request.area ? ` · ${request.area}` : ""}`
          : ""
      }
      action={
        <Button asChild size="lg" className="h-12 rounded-full px-6">
          <Link to="/assistant">Write today's update</Link>
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Tasks today"
          value={`${done} of ${today.length}`}
          hint={done === today.length ? "All marked complete" : "Marked complete so far"}
        />
        <StatTile
          label="Next up"
          value={next?.scheduled_time || next?.time_of_day || "—"}
          hint={next?.title ?? "Nothing pending"}
        />
        <StatTile label="Care circle" value={request?.person_name || "—"} hint="Shared with family" />
      </div>

      {isLoading ? (
        <SoftCard>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading today's plan…
          </p>
        </SoftCard>
      ) : (
        <SoftCard>
          <SectionTitle hint="You can always change these">Today's plan</SectionTitle>
          <ul className="space-y-2">
            {today.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                log={logFor(logs, task.id)}
                saving={save.isPending}
                onSave={(status, note, postponedTo) =>
                  save.mutate({ task, status, note, postponedTo })
                }
              />
            ))}
          </ul>
        </SoftCard>
      )}

      {request?.structured?.preferences?.length ? (
        <SoftCard tone="sage">
          <h2 className="text-lg font-semibold">Things that matter to her</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {request.structured.preferences.map((p) => (
              <span key={p} className="rounded-full bg-card/70 px-3 py-1 text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        </SoftCard>
      ) : null}
    </AppShell>
  );
}
