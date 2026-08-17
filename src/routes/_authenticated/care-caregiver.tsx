import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Clock, Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, SectionTitle, StatTile } from "@/components/ui-kit";
import { TaskRow, useTaskSave } from "@/components/task-checklist";
import { useCareRealtime } from "@/lib/care-social";
import { useMyProfile } from "@/lib/auth";
import { DAY_LABELS, clampBuffer, type DayKey } from "@/lib/care-types";
import { logFor, tasksForDay, useCareContext } from "@/lib/use-care";

export const Route = createFileRoute("/_authenticated/care-caregiver")({
  head: () => ({
    meta: [
      { title: "Care checklist — Mitra" },
      {
        name: "description",
        content:
          "The caregiver's operational checklist: today's tasks, their timings and completion windows, with complete, postpone and note actions.",
      },
      { property: "og:title", content: "Care checklist — Mitra" },
      {
        property: "og:description",
        content: "Today's care tasks, timings and notes in one calm checklist.",
      },
    ],
  }),
  component: CareCaregiverPage,
});

function CareCaregiverPage() {
  const profile = useMyProfile();

  if (profile.isLoading) return <LoadingShell />;
  if (profile.data && profile.data.role !== "caregiver") return <Navigate to="/care-family" />;

  return <CaregiverChecklist />;
}

function LoadingShell() {
  return (
    <AppShell role="caregiver" title="Care checklist">
      <SoftCard>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading…
        </p>
      </SoftCard>
    </AppShell>
  );
}

function CaregiverChecklist() {
  const { request, tasks: allTasks, logs, date, isLoading } = useCareContext();
  useCareRealtime(request?.id);

  const tasks = allTasks.filter((t) => t.is_active);
  const hasActiveMatch = Boolean(
    request && request.match_status === "active" && request.selected_caregiver_id,
  );
  const today = tasksForDay(tasks);
  const done = today.filter((t) => logFor(logs, t.id)?.status === "done").length;
  const next = today.find((t) => (logFor(logs, t.id)?.status ?? "pending") === "pending");
  const save = useTaskSave({ request, logs, date });

  return (
    <AppShell
      role="caregiver"
      title="Care checklist"
      subtitle={request?.person_name ? `Today with ${request.person_name}` : ""}
      action={
        <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-6">
          <Link to="/chat">Message the family</Link>
        </Button>
      }
    >
      <SoftCard tone="sage">
        <p className="text-sm">
          The family keeps this plan up to date. You can mark tasks complete, postpone them and add
          notes — if something in the plan itself needs changing, send the family a message.
        </p>
      </SoftCard>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Tasks today"
          value={`${done} of ${today.length}`}
          hint={
            today.length > 0 && done === today.length
              ? "All marked complete"
              : "Marked complete so far"
          }
        />
        <StatTile
          label="Next up"
          value={next?.scheduled_time || next?.time_of_day || "—"}
          hint={next?.title ?? "Nothing pending"}
        />
        <StatTile
          label="Care circle"
          value={request?.person_name || "—"}
          hint="Shared with the family"
        />
      </div>

      {isLoading ? (
        <SoftCard>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading today's plan…
          </p>
        </SoftCard>
      ) : today.length === 0 ? (
        <SoftCard>
          <p className="text-sm text-muted-foreground">
            There's nothing scheduled for today. Once the family confirms a plan, today's tasks will
            appear here.
          </p>
        </SoftCard>
      ) : (
        <SoftCard>
          <SectionTitle hint={`${today.length} today`}>Today's checklist</SectionTitle>
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

      <SoftCard>
        <SectionTitle hint={`${tasks.length} tasks`}>The weekly rhythm</SectionTitle>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            There's no plan yet. It will appear here once the family confirms one.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-2xl border border-border p-4">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  <span className="tabular-nums">{task.scheduled_time || task.time_of_day}</span>
                </p>
                <p className="mt-1 font-medium">{task.title}</p>
                {task.details && (
                  <p className="mt-1 text-sm text-muted-foreground">{task.details}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="sage">{task.category}</Pill>
                  <Pill tone="sky">{clampBuffer(task.buffer_minutes)} min window</Pill>
                  {task.days.map((d) => (
                    <Pill key={d}>{DAY_LABELS[d as DayKey] ?? d}</Pill>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SoftCard>
    </AppShell>
  );
}
